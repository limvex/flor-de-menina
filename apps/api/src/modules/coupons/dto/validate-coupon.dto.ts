import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsInt,
  IsPositive,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ValidateCouponItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  categoryId!: string;
}

export class ValidateCouponDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  code!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidateCouponItemDto)
  items!: ValidateCouponItemDto[];

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}
