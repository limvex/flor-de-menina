import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtGuard } from './customer-jwt.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

const ACCESS_COOKIE = 'flor_customer_token';
const REFRESH_COOKIE = 'flor_customer_refresh';
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function cookieOptions(isProd: boolean) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
  };
}

@Controller('auth/customer')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class CustomerAuthController {
  private isProd = process.env.NODE_ENV === 'production';

  constructor(private service: CustomerAuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  async register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.service.login(
      dto,
      req.headers['user-agent'],
      req.ip,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(CustomerJwtGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const user = req.user as { id: string };

    if (refreshToken && user) {
      await this.service.logout(user.id, refreshToken);
    }

    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/auth/customer/refresh' });

    return { success: true };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.service.refresh(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);

    return { success: true };
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.service.verifyEmail(dto.token);
    return { success: true };
  }

  @Post('resend-verification')
  @HttpCode(200)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.service.resendVerification(dto.email);
    return { success: true };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.service.forgotPassword(dto.email);
    return { success: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.service.resetPassword(dto.token, dto.newPassword);
    return { success: true };
  }

  @Get('google')
  getGoogleUrl() {
    return { url: this.service.googleService.getAuthUrl() };
  }

  @Post('google/callback')
  @HttpCode(200)
  async googleCallback(
    @Body() dto: GoogleCallbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.service.googleCallback(
        dto.code,
        req.headers['user-agent'],
        req.ip,
      );

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(CustomerJwtGuard)
  async me(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.service.me(user.id);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const base = cookieOptions(this.isProd);

    res.cookie(ACCESS_COOKIE, accessToken, {
      ...base,
      maxAge: ACCESS_MAX_AGE,
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...base,
      maxAge: REFRESH_MAX_AGE,
      path: '/auth/customer/refresh',
    });
  }
}
