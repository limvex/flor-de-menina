import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ShippingOptionDto {
  @IsString()
  carrier!: string;

  @IsString()
  service!: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsInt()
  @Min(0)
  estimatedDays!: number;
}

export class CreateOrderDto {
  @IsString()
  addressId!: string;

  @ValidateNested()
  @Type(() => ShippingOptionDto)
  shippingOption!: ShippingOptionDto;

  @IsEnum(['PIX', 'CREDIT_CARD'])
  paymentMethod!: 'PIX' | 'CREDIT_CARD';

  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido' })
  cpf!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  notes?: string;
}
