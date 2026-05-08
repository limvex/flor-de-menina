import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

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
  @IsInt() @IsOptional() @Min(1) @Max(48) @Type(() => Number) limit?: number =
    24;
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() categorySlug?: string;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  )
  sizes?: string[];
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  )
  colors?: string[];
  @IsOptional() @Type(() => Number) minPrice?: number;
  @IsOptional() @Type(() => Number) maxPrice?: number;
  @IsEnum(['relevance', 'newest', 'price_asc', 'price_desc', 'bestselling'])
  @IsOptional()
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'bestselling' =
    'relevance';
}
