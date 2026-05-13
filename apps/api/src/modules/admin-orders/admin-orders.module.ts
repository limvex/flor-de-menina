import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { CouponsModule } from '../coupons/coupons.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule, CouponsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
