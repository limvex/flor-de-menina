import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MergeItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class MergeCartDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MergeItemDto)
  items!: MergeItemDto[];
}
