import { Injectable, Logger } from '@nestjs/common';
import { createId } from '@flor/database';
import {
  PaymentGatewayAdapter,
  PixPaymentResult,
  CardPaymentResult,
  PaymentStatusResult,
  InstallmentOption,
} from './payment-gateway.interface';

@Injectable()
export class MockPaymentAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(MockPaymentAdapter.name);
  private readonly APPROVAL_RATE = 0.8;

  async createPixPayment(input: {
    orderId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    customerCpf: string;
    description: string;
  }): Promise<PixPaymentResult> {
    await this.simulateDelay();

    const externalId = `mock_pix_${createId()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    this.logger.log(
      `[MOCK] PIX criado: orderId=${input.orderId} amount=${input.amount}`,
    );

    return {
      externalId,
      qrCode: this.generateMockPixQrCode(externalId, input.amount),
      qrCodeBase64: this.generateMockQrCodeBase64(),
      copyPaste: this.generateMockPixQrCode(externalId, input.amount),
      expiresAt,
      status: 'pending',
    };
  }

  async processCardPayment(input: {
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
  }): Promise<CardPaymentResult> {
    await this.simulateDelay();

    const externalId = `mock_card_${createId()}`;
    const approved = Math.random() < this.APPROVAL_RATE;

    const tokenParts = input.cardToken.split('_');
    const brand = tokenParts[2]?.toLowerCase() || 'visa';
    const last4 = tokenParts[3] || '4242';

    this.logger.log(
      `[MOCK] Cartão processado: orderId=${input.orderId} status=${approved ? 'approved' : 'rejected'} amount=${input.amount} installments=${input.installments}`,
    );

    if (approved) {
      return {
        externalId,
        transactionId: `mock_tx_${createId()}`,
        status: 'approved',
        cardLast4: last4,
        cardBrand: brand,
        cardHolderName: input.customerName,
      };
    }

    const rejectionReasons = [
      'cc_rejected_insufficient_amount',
      'cc_rejected_high_risk',
      'cc_rejected_other_reason',
      'cc_rejected_bad_filled_security_code',
    ];

    return {
      externalId,
      transactionId: '',
      status: 'rejected',
      cardLast4: last4,
      cardBrand: brand,
      cardHolderName: input.customerName,
      failureReason:
        rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)],
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    await this.simulateDelay(100, 300);

    const isPix = externalId.startsWith('mock_pix_');

    if (isPix) {
      const isPaid = Math.random() < 0.6;
      if (isPaid) {
        return {
          externalId,
          status: 'approved',
          paidAt: new Date(),
          transactionId: `mock_tx_${createId()}`,
        };
      }
    }

    return { externalId, status: 'pending' };
  }

  validateWebhookSignature(input: {
    rawBody: string;
    signature: string;
    requestId: string;
  }): boolean {
    return (
      input.signature === 'MOCK_VALID' || input.signature.startsWith('mock_')
    );
  }

  async getInstallmentOptions(amount: number): Promise<InstallmentOption[]> {
    await this.simulateDelay(50, 200);

    const options: InstallmentOption[] = [];

    for (let i = 1; i <= 12; i++) {
      const hasInterest = i > 3;
      const interestMultiplier = hasInterest ? Math.pow(1.0199, i - 3) : 1;
      const totalAmount = Number((amount * interestMultiplier).toFixed(2));
      const installmentAmount = Number((totalAmount / i).toFixed(2));

      options.push({
        installments: i,
        installmentAmount,
        totalAmount,
        hasInterest,
      });
    }

    return options;
  }

  private async simulateDelay(min = 300, max = 1500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private generateMockPixQrCode(externalId: string, amount: number): string {
    const amountStr = amount.toFixed(2);
    return `00020126580014BR.GOV.BCB.PIX0136mock-${externalId.slice(-8)}5204000053039865802BR5913FLORDEMENINA6009MACEIO6304MOCK${amountStr}`;
  }

  private generateMockQrCodeBase64(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="40" height="40" fill="black"/>
      <rect x="140" y="20" width="40" height="40" fill="black"/>
      <rect x="20" y="140" width="40" height="40" fill="black"/>
      <rect x="80" y="80" width="40" height="40" fill="black"/>
      <text x="100" y="180" font-family="monospace" font-size="8" text-anchor="middle" fill="gray">MOCK PIX</text>
    </svg>`;
    return Buffer.from(svg).toString('base64');
  }
}
