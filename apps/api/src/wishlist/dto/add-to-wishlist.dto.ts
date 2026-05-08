import { IsString, IsOptional } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;
}
