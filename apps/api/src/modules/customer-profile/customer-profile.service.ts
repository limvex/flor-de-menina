import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { prisma } from '@flor/database';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@Injectable()
export class CustomerProfileService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        passwordHash: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const { passwordHash, ...rest } = user;
    return { ...rest, hasPassword: !!passwordHash };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
    return { ...user, hasPassword: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Conta vinculada ao Google — sem senha para alterar',
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Senha atual incorreta');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { success: true };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.newEmail },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, googleId: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Senha atual obrigatória para trocar o e-mail',
        );
      }
      const valid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!valid) throw new BadRequestException('Senha atual incorreta');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail, emailVerified: false },
    });
    return { success: true };
  }

  async getOrders(userId: string) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          items: true,
          shipping: { select: { trackingCode: true } },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders: orders.map((o) => this.formatCustomerOrder(o)),
      total,
      page: 1,
      limit: 20,
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipping: { select: { trackingCode: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.userId !== userId)
      throw new NotFoundException('Pedido não encontrado');
    return this.formatCustomerOrder(order);
  }

  private formatCustomerOrder(order: {
    id: string;
    number: string;
    status: string;
    subtotal: { toNumber(): number };
    shippingCost: { toNumber(): number };
    discount: { toNumber(): number };
    total: { toNumber(): number };
    shippingAddress: unknown;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productName: string;
      variantSize: string | null;
      variantColor: string | null;
      productImageUrl: string | null;
      unitPrice: { toNumber(): number };
      quantity: number;
      subtotal: { toNumber(): number };
    }>;
    shipping: { trackingCode: string | null } | null;
  }) {
    const addr = order.shippingAddress as {
      recipientName: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    return {
      id: order.id,
      number: order.number,
      status: order.status,
      subtotal: order.subtotal.toNumber(),
      shippingCost: order.shippingCost.toNumber(),
      discount: order.discount.toNumber(),
      total: order.total.toNumber(),
      couponCode: null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantSize: item.variantSize,
        variantColor: item.variantColor,
        productImageUrl: item.productImageUrl,
        unitPrice: item.unitPrice.toNumber(),
        quantity: item.quantity,
        subtotal: item.subtotal.toNumber(),
      })),
      trackingCode: order.shipping?.trackingCode ?? null,
      shippingAddress: addr,
    };
  }
}
