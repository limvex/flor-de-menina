import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { prisma, UserRole, createId } from '@flor/database';
import { MailService } from '../../mail/mail.service';
import { GoogleService } from './google.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
}

const BCRYPT_ROUNDS = 12;
const VERIFICATION_EXPIRY_HOURS = 24;
const RESET_EXPIRY_HOURS = 1;

@Injectable()
export class CustomerAuthService {
  constructor(
    private jwtService: JwtService,
    private mailService: MailService,
    readonly googleService: GoogleService,
    private config: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ id: string; email: string; name: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        id: createId(),
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        emailVerified: false,
      },
    });

    const token = createId();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await prisma.emailVerification.create({
      data: {
        id: createId(),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.mailService.sendVerification(user.email, user.name, token);

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    user: CustomerUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'E-mail não verificado. Verifique sua caixa de entrada.',
      );
    }

    return this.generateTokensAndSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      userAgent,
      ipAddress,
    );
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(
        refreshToken,
        {
          secret: this.config.get<string>('JWT_CUSTOMER_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido');
    }

    if (payload.type !== 'customer-refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    // Valida o hash do refresh token
    const sessions = await prisma.session.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const validSession = await Promise.all(
      sessions.map(async (s) => {
        const matches = await bcrypt.compare(refreshToken, s.refreshHash);
        return matches ? s : null;
      }),
    ).then((results) => results.find(Boolean));

    if (!validSession) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Revoga sessão antiga e cria nova (rotação de refresh token)
    await prisma.session.update({
      where: { id: validSession.id },
      data: { revokedAt: new Date() },
    });

    const customerUser: CustomerUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    const newAccessToken = this.generateAccessToken(customerUser);
    const newRefreshToken = this.generateRefreshToken(user.id);

    const newHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
    const refreshExpiry =
      this.config.get<string>('JWT_CUSTOMER_REFRESH_EXPIRES_IN') || '30d';
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(refreshExpiry),
    );

    await prisma.session.create({
      data: {
        id: createId(),
        userId: user.id,
        refreshHash: newHash,
        userAgent: validSession.userAgent,
        ipAddress: validSession.ipAddress,
        expiresAt,
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // Revoga a sessão correspondente ao refresh token
    for (const session of sessions) {
      const matches = await bcrypt.compare(refreshToken, session.refreshHash);
      if (matches) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new BadRequestException('Token inválido');
    }

    if (verification.usedAt) {
      throw new BadRequestException('Token já utilizado');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      // Silencioso — não vaza se e-mail existe ou já está verificado
      return;
    }

    // Invalida tokens antigos
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = createId();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await prisma.emailVerification.create({
      data: {
        id: createId(),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.mailService.sendVerification(user.email, user.name, token);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Silencioso — não vaza se e-mail existe
      return;
    }

    const token = createId();
    const expiresAt = new Date(
      Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await prisma.passwordReset.create({
      data: {
        id: createId(),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.mailService.sendPasswordReset(user.email, user.name, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset) {
      throw new BadRequestException('Token inválido');
    }

    if (reset.usedAt) {
      throw new BadRequestException('Token já utilizado');
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoga todos os refresh tokens do usuário (segurança)
      prisma.session.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async googleCallback(
    code: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    user: CustomerUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const googleUser = await this.googleService.exchangeCode(code);

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: createId(),
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          role: UserRole.CUSTOMER,
          emailVerified: true,
        },
      });
    } else if (!user.googleId) {
      // Vincula googleId à conta existente por e-mail
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, emailVerified: true },
      });
    }

    return this.generateTokensAndSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      userAgent,
      ipAddress,
    );
  }

  async me(userId: string): Promise<CustomerUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  private generateAccessToken(user: CustomerUser): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('JWT_CUSTOMER_SECRET'),
        expiresIn: this.config.get<string>('JWT_CUSTOMER_EXPIRES_IN') || '15m',
      },
    );
  }

  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'customer-refresh' },
      {
        secret: this.config.get<string>('JWT_CUSTOMER_REFRESH_SECRET'),
        expiresIn:
          this.config.get<string>('JWT_CUSTOMER_REFRESH_EXPIRES_IN') || '30d',
      },
    );
  }

  private async generateTokensAndSession(
    user: CustomerUser,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    user: CustomerUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user.id);

    const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const refreshExpiry =
      this.config.get<string>('JWT_CUSTOMER_REFRESH_EXPIRES_IN') || '30d';
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(refreshExpiry),
    );

    await prisma.session.create({
      data: {
        id: createId(),
        userId: user.id,
        refreshHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return { user, accessToken, refreshToken };
  }

  private parseDurationMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // 30d fallback
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }
}
