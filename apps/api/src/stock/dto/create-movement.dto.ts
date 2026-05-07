import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum StockMovementTypeDto {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export class CreateMovementDto {
  @IsString()
  variantId: string;

  @IsEnum(StockMovementTypeDto)
  type: StockMovementTypeDto;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  reason: string;

  @IsBoolean()
  @IsOptional()
  forced?: boolean = false;
}
