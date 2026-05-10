import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  originZipCode?: string;

  @IsOptional()
  originAddress?: unknown;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingGlobalThreshold?: number | null;

  @IsOptional()
  @IsString()
  @IsIn(['mock', 'melhor_envio'])
  shippingProvider?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeEmail?: string | null;

  @IsOptional()
  @IsString()
  storePhone?: string | null;

  @IsOptional()
  @IsString()
  storeCnpj?: string | null;
}
