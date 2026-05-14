import { Injectable } from '@nestjs/common';
import { prisma } from '@flor/database';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
        mustChangePassword: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async validatePassword(
    user: { passwordHash: string | null },
    password: string,
  ): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, user.passwordHash);
  }
}
