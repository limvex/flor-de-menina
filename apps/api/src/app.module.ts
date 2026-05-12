import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomerAuthModule } from './auth/customer/customer-auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { AiModule } from './ai/ai.module';
import { StockModule } from './modules/stock/stock.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CustomerProfileModule } from './modules/customer-profile/customer-profile.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PagesModule } from './modules/pages/pages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get<string>('REDIS_PORT', '6379')),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CustomerAuthModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    AiModule,
    StockModule,
    WishlistModule,
    CartModule,
    AddressesModule,
    CustomerProfileModule,
    OrdersModule,
    ShippingModule,
    PaymentsModule,
    EmailModule,
    CouponsModule,
    PagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
