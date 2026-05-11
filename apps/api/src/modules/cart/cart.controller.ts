import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { CustomerJwtGuard } from '../../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';

class ApplyCouponDto {
  @IsString()
  code!: string;
}

@Controller('cart')
@UseGuards(CustomerJwtGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(@Body() dto: AddItemDto, @CurrentUser() user: User) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:variantId')
  updateItem(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.cartService.updateItem(user.id, variantId, dto);
  }

  @Delete('items/:variantId')
  @HttpCode(HttpStatus.OK)
  removeItem(@Param('variantId') variantId: string, @CurrentUser() user: User) {
    return this.cartService.removeItem(user.id, variantId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }

  @Post('merge')
  mergeCart(@Body() dto: MergeCartDto, @CurrentUser() user: User) {
    return this.cartService.mergeCart(user.id, dto);
  }

  @Post('coupon')
  applyCoupon(@Body() dto: ApplyCouponDto, @CurrentUser() user: User) {
    return this.cartService.applyCouponToCart(user.id, dto.code);
  }

  @Delete('coupon')
  @HttpCode(HttpStatus.OK)
  removeCoupon(@CurrentUser() user: User) {
    return this.cartService.removeCouponFromCart(user.id);
  }
}
