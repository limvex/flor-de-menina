import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class CounterSaleDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean;
}
