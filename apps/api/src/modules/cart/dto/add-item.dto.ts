import { IsString, IsInt, Min, Max } from 'class-validator';

export class AddItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}
