import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateRegionRuleDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingMin?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
