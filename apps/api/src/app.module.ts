import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
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
