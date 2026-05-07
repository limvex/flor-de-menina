import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';

export class ListMovementsDto {
  @IsInt() @IsOptional() @Min(1) page?: number = 1;
  @IsInt() @IsOptional() @Min(1) @Max(100) limit?: number = 50;
  @IsString() @IsOptional() variantId?: string;
  @IsString() @IsOptional() productId?: string;
  @IsString() @IsOptional() userId?: string;
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() reason?: string;
  @IsString() @IsOptional() dateFrom?: string; // ISO
  @IsString() @IsOptional() dateTo?: string; // ISO
  @IsString() @IsOptional() orderId?: string;
}
