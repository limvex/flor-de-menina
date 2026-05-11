import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
  Matches,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponType } from '@flor/database';

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Código deve conter apenas letras maiúsculas, números, _ e -',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.type !== CouponType.FREE_SHIPPING)
  value!: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validUntil!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  maxTotalUses?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  maxUsesPerCustomer?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCartValue?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxDiscountAmount?: number | null;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
