export interface PixPaymentResult {
  externalId: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: Date;
  status: 'pending';
}

export interface CardPaymentResult {
  externalId: string;
  transactionId: string;
  status: 'approved' | 'rejected' | 'in_process';
  cardLast4: string;
  cardBrand: string;
  cardHolderName: string;
  failureReason?: string;
}

export interface PaymentStatusResult {
  externalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  paidAt?: Date;
  transactionId?: string;
  failureReason?: string;
}

export interface InstallmentOption {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  hasInterest: boolean;
}

export interface PaymentGatewayAdapter {
  createPixPayment(input: {
    orderId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    customerCpf: string;
    description: string;
  }): Promise<PixPaymentResult>;

  processCardPayment(input: {
    orderId: string;
    amount: number;
    installments: number;
    cardToken: string;
    paymentMethodId: string;
    issuerId?: string;
    customerEmail: string;
    customerName: string;
    customerCpf: string;
    description: string;
  }): Promise<CardPaymentResult>;

  getPaymentStatus(externalId: string): Promise<PaymentStatusResult>;

  validateWebhookSignature(input: {
    rawBody: string;
    signature: string;
    requestId: string;
  }): boolean;

  getInstallmentOptions(amount: number): Promise<InstallmentOption[]>;
}
