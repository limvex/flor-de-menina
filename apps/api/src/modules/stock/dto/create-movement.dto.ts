import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export enum MovementTypeInput {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export enum MovementSourceInput {
  MANUAL_IN = 'MANUAL_IN',
  MANUAL_ADJUST = 'MANUAL_ADJUST',
  LOSS = 'LOSS',
  RETURN = 'RETURN',
}

export class CreateMovementDto {
  @IsString()
  variantId: string;

  @IsEnum(MovementTypeInput)
  type: MovementTypeInput;

  @IsEnum(MovementSourceInput)
  source: MovementSourceInput;

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
