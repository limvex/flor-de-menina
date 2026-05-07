import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class QuickSaleDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}
