import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { GoogleService } from './google.service';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MailModule],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerJwtStrategy, GoogleService],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
