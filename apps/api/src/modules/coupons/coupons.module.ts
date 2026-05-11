import { Module } from '@nestjs/common';
import { CouponsAdminController } from './coupons.admin.controller';
import { CouponsPublicController } from './coupons.public.controller';
import { CouponsService } from './coupons.service';

@Module({
  controllers: [CouponsAdminController, CouponsPublicController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
