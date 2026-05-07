import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';

export class ListStockDto {
  @IsInt() @IsOptional() @Min(1) page?: number = 1;
  @IsInt() @IsOptional() @Min(1) @Max(100) limit?: number = 50;
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() productId?: string;
  @IsEnum(['all', 'low', 'zero', 'available']) @IsOptional() status?: string =
    'all';
  @IsEnum(['stock', 'name', 'category']) @IsOptional() sortBy?: string =
    'stock';
  @IsEnum(['asc', 'desc']) @IsOptional() sortOrder?: 'asc' | 'desc' = 'asc';
}
