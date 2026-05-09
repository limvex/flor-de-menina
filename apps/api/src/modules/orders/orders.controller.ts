import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CustomerJwtGuard } from '../../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(CustomerJwtGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('shipping-options')
  getShippingOptions(@Query('subtotal') subtotalStr?: string) {
    const subtotal = subtotalStr ? parseFloat(subtotalStr) : 0;
    return this.ordersService.getShippingOptions(subtotal);
  }

  @Post()
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.getOrder(user.id, id);
  }
}
