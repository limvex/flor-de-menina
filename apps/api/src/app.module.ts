import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { bullMqRedisConnectionFromProcess } from './config/env.schema';
import { isSensitivePath } from './common/logger/sensitive-routes';
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
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AdminOrdersModule } from './modules/admin-orders/admin-orders.module';
import { HomeContentModule } from './modules/home-content/home-content.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req) => {
          const h = req.headers['x-request-id'];
          return typeof h === 'string' && h.length > 0 ? h : randomUUID();
        },
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
        serializers: {
          req(req) {
            const r = req as { id?: string; url?: string };
            const pathOnly = r.url?.split('?')[0] ?? '';
            return {
              id: r.id,
              method: req.method,
              url: isSensitivePath(pathOnly) ? '[SENSITIVE_ROUTE]' : r.url,
            };
          },
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: bullMqRedisConnectionFromProcess(),
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
    AdminDashboardModule,
    AdminOrdersModule,
    HomeContentModule,
    AdminUsersModule,
    HealthModule,
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
