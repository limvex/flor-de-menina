export class PaymentStatusResponseDto {
  paymentId!: string;
  orderId!: string;
  orderNumber!: string;
  method!: 'PIX' | 'CREDIT_CARD';
  status!: string;
  paidAt?: Date | null;
  pix?: {
    qrCode: string | null;
    qrCodeBase64: string | null;
    copyPaste: string | null;
    expiresAt: Date | null;
  };
  card?: {
    last4: string | null;
    brand: string | null;
    installments: number;
  };
  failureReason?: string | null;
}
