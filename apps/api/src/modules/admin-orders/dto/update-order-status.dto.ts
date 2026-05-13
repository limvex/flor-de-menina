import { OrderStatus } from '@flor/database';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const ADMIN_NEXT_STATUSES: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export class UpdateOrderStatusDto {
  @IsIn(ADMIN_NEXT_STATUSES)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsBoolean()
  notifyCustomer?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
