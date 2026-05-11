import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { OptionalCustomerJwtGuard } from '../../auth/customer/optional-customer-jwt.guard';

@Controller('coupons')
export class CouponsPublicController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(OptionalCustomerJwtGuard)
  validate(
    @Body() dto: ValidateCouponDto,
    @Request() req: { user?: { id: string } },
  ) {
    return this.couponsService.validate(dto, req.user?.id);
  }
}
