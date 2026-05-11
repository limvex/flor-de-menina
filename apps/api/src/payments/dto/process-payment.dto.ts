import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  orderId!: string;

  @IsEnum(['PIX', 'CREDIT_CARD'])
  method!: 'PIX' | 'CREDIT_CARD';

  @IsString()
  @IsOptional()
  cardToken?: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  installments?: number;
}
