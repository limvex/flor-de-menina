import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  MinLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() @MinLength(3) name: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() description: string;
  @IsString() @IsOptional() shortDescription?: string;
  @IsNumber() @Min(0.01) basePrice: number;
  @IsNumber() @IsOptional() compareAtPrice?: number;
  @IsString() categoryId: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsBoolean() @IsOptional() isFeatured?: boolean;
  @IsInt() @IsOptional() weight?: number;
  @IsInt() @IsOptional() width?: number;
  @IsInt() @IsOptional() height?: number;
  @IsInt() @IsOptional() length?: number;
  @IsString() @IsOptional() seoTitle?: string;
  @IsString() @IsOptional() seoDescription?: string;
}
