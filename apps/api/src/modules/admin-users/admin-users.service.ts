import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { prisma, createId, UserRole } from '@flor/database';
import type { CreateAdminDto } from './dto/create-admin.dto';
import type { UpdateAdminDto } from './dto/update-admin.dto';

const BCRYPT_ROUNDS = 12;

function toAdminDto(user: {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  };
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  async listAdmins() {
    const users = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });
    return users.map(toAdminDto);
  }

  async createAdmin(dto: CreateAdminDto, currentUserId: string) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(
      dto.temporaryPassword,
      BCRYPT_ROUNDS,
    );

    const user = await prisma.user.create({
      data: {
        id: createId(),
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: true,
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin criado: ${dto.email} por userId ${currentUserId}`);
    return toAdminDto(user);
  }

  async updateAdmin(id: string, dto: UpdateAdminDto) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new NotFoundException('Admin não encontrado');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name: dto.name },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });
    return toAdminDto(updated);
  }

  async deleteAdmin(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException(
        'Você não pode desativar sua própria conta',
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new NotFoundException('Admin não encontrado');
    }

    const activeCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    });
    if (activeCount <= 1) {
      throw new ConflictException(
        'Não é possível desativar o único admin ativo. Crie outro admin primeiro.',
      );
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { ok: true };
  }
}
