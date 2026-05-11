import { api } from './client';
import type { ProcessPaymentResponse, PaymentPollStatusResponse } from '@flor/types';

export interface InstallmentOptionDto {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  hasInterest: boolean;
}

export async function getInstallmentOptions(amount: number): Promise<InstallmentOptionDto[]> {
  return api.get<InstallmentOptionDto[]>(
    `/payments/installments?amount=${encodeURIComponent(String(amount))}`,
  );
}

export async function processPayment(body: {
  orderId: string;
  method: 'PIX' | 'CREDIT_CARD';
  cardToken?: string;
  paymentMethodId?: string;
  installments?: number;
}): Promise<ProcessPaymentResponse> {
  return api.post<ProcessPaymentResponse>('/payments/process', body);
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentPollStatusResponse> {
  return api.get<PaymentPollStatusResponse>(`/payments/${paymentId}/status`);
}
