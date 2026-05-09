import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  async findAll(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const cep = dto.zipCode.replace('-', '');
    const viaCepData = await this.fetchViaCep(cep);

    return prisma.$transaction(async (tx) => {
      if (dto.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (dto.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.create({
        data: {
          id: createId(),
          userId,
          label: dto.label,
          recipientName: dto.recipientName,
          zipCode: this.formatCep(cep),
          street: dto.street || viaCepData?.logradouro || '',
          number: dto.number,
          complement: dto.complement,
          neighborhood: dto.neighborhood || viaCepData?.bairro || '',
          city: dto.city || viaCepData?.localidade || '',
          state: (dto.state || viaCepData?.uf || '').toUpperCase(),
          isDefaultShipping: dto.isDefaultShipping ?? false,
          isDefaultBilling: dto.isDefaultBilling ?? false,
        },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.findOneOrThrow(userId, id);

    return prisma.$transaction(async (tx) => {
      if (dto.isDefaultShipping && !address.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (dto.isDefaultBilling && !address.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      let zipCode = address.zipCode;
      if (dto.zipCode) {
        const cep = dto.zipCode.replace('-', '');
        zipCode = this.formatCep(cep);
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.recipientName && { recipientName: dto.recipientName }),
          ...(dto.zipCode && { zipCode }),
          ...(dto.street && { street: dto.street }),
          ...(dto.number && { number: dto.number }),
          ...(dto.complement !== undefined && { complement: dto.complement }),
          ...(dto.neighborhood && { neighborhood: dto.neighborhood }),
          ...(dto.city && { city: dto.city }),
          ...(dto.state && { state: dto.state.toUpperCase() }),
          ...(dto.isDefaultShipping !== undefined && {
            isDefaultShipping: dto.isDefaultShipping,
          }),
          ...(dto.isDefaultBilling !== undefined && {
            isDefaultBilling: dto.isDefaultBilling,
          }),
        },
      });
    });
  }

  async remove(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    await prisma.address.delete({ where: { id } });
    return { success: true };
  }

  async setDefaultShipping(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
      return tx.address.update({
        where: { id },
        data: { isDefaultShipping: true },
      });
    });
  }

  async setDefaultBilling(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
      return tx.address.update({
        where: { id },
        data: { isDefaultBilling: true },
      });
    });
  }

  private async findOneOrThrow(userId: string, id: string) {
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Endereço não encontrado');
    if (address.userId !== userId) throw new ForbiddenException();
    return address;
  }

  private async fetchViaCep(cep: string) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean;
      };
      if (data.erro) throw new BadRequestException('CEP não encontrado');
      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      return null;
    }
  }

  private formatCep(digits: string): string {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
}
