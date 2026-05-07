import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantInput {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() sku?: string;
  @IsString() @IsOptional() size?: string;
  @IsString() @IsOptional() color?: string;
  @IsString() @IsOptional() colorHex?: string;
  @IsNumber() @IsOptional() price?: number;
  @IsInt() @Min(0) stock: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpsertVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInput)
  variants: VariantInput[];
}

export class BulkSetActiveDto {
  @IsArray() ids: string[];
  @IsBoolean() active: boolean;
}
