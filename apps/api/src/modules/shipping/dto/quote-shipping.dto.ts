import {
  IsString,
  IsNumber,
  IsPositive,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class QuoteShippingDto {
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  destinationZipCode!: string;

  @IsNumber()
  @IsPositive()
  subtotal!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
