import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StockModule } from '../stock/stock.module';
import { CouponsModule } from '../coupons/coupons.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [StockModule, CouponsModule, MailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
