import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ListCouponsQuery, ListUsagesQuery } from './dto/list-coupons.query';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard)
export class CouponsAdminController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  findAll(@Query() query: ListCouponsQuery) {
    return this.couponsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Get(':id/usages')
  findUsages(@Param('id') id: string, @Query() query: ListUsagesQuery) {
    return this.couponsService.findUsages(id, query);
  }

  @Post()
  create(@Body() dto: CreateCouponDto, @CurrentUser() user: User) {
    return this.couponsService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }
}
