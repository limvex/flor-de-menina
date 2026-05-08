import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartCleanupService } from './cart-cleanup.service';

@Module({
  controllers: [CartController],
  providers: [CartService, CartCleanupService],
  exports: [CartService],
})
export class CartModule {}
