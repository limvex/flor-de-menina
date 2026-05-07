import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProductsDto {
  @IsInt() @IsOptional() @Min(1) @Type(() => Number) page?: number = 1;
  @IsInt() @IsOptional() @Min(1) @Max(100) @Type(() => Number) limit?: number =
    20;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() search?: string;
  @IsEnum(['active', 'inactive', 'all']) @IsOptional() status?:
    | 'active'
    | 'inactive'
    | 'all' = 'all';
  @IsEnum(['available', 'out_of_stock', 'all']) @IsOptional() stock?:
    | 'available'
    | 'out_of_stock'
    | 'all' = 'all';
  @IsEnum(['createdAt', 'name', 'basePrice']) @IsOptional() sortBy?: string =
    'createdAt';
  @IsEnum(['asc', 'desc']) @IsOptional() sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ListPublicProductsDto {
  @IsInt() @IsOptional() @Min(1) @Type(() => Number) page?: number = 1;
  @IsInt() @IsOptional() @Min(1) @Max(100) @Type(() => Number) limit?: number =
    20;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() search?: string;
  @IsEnum(['createdAt', 'name', 'basePrice']) @IsOptional() sort?: string =
    'createdAt';
}
