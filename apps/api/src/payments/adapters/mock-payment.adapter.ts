import { ConfigService } from '@nestjs/config';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { createId } from '@flor/database';
import {
  MockFinalStatus,
  WebhookSimulatorService,
} from '../webhooks/webhook-simulator.service';
import {
  PaymentGatewayAdapter,
  PixPaymentResult,
  CardPaymentResult,
  PaymentStatusResult,
  InstallmentOption,
} from './payment-gateway.interface';

type MockPaymentState = 'pending' | 'approved' | 'rejected';

@Injectable()
export class MockPaymentAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(MockPaymentAdapter.name);
  private readonly paymentStates = new Map<string, MockPaymentState>();
  private readonly pixApprovalRate: number;
  private readonly cardApprovalRate: number;
  private readonly pixWebhookDelayMs: number;
  private readonly cardWebhookDelayMs: number;

  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => WebhookSimulatorService))
    private readonly webhookSimulator: WebhookSimulatorService,
  ) {
    this.pixApprovalRate = this.config.get<number>(
      'MOCK_PIX_APPROVAL_RATE',
      0.9,
    );
    this.cardApprovalRate = this.config.get<number>(
      'MOCK_CARD_APPROVAL_RATE',
      0.8,
    );
    this.pixWebhookDelayMs = this.config.get<number>(
      'MOCK_WEBHOOK_PIX_DELAY_MS',
      8000,
    );
    this.cardWebhookDelayMs = this.config.get<number>(
      'MOCK_WEBHOOK_CARD_DELAY_MS',
      2000,
    );
  }

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
    this.paymentStates.set(externalId, 'pending');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    this.logger.log(
      `[MOCK] PIX criado: orderId=${input.orderId} amount=${input.amount}`,
    );

    const willApprove = Math.random() < this.pixApprovalRate;
    const finalStatus: MockFinalStatus = willApprove ? 'approved' : 'rejected';

    // Agenda webhook simulado (timer em setTimeout)
    this.webhookSimulator.simulateWebhook({
      externalId,
      delayMs: this.pixWebhookDelayMs,
      finalStatus,
    });

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
    this.paymentStates.set(externalId, 'pending');

    const tokenParts = input.cardToken.split('_');
    const brand = tokenParts[2]?.toLowerCase() || 'visa';
    const last4 = tokenParts[3] || '4242';

    // Perfis: mock_tok_visa_4242 / mock_tok_mastercard_5454 = aprova; mock_tok_visa_0001 = recusa.
    let approved: boolean;
    if (input.cardToken.includes('_0001')) {
      approved = false;
    } else if (
      input.cardToken.includes('_4242') ||
      input.cardToken.includes('_5454')
    ) {
      approved = true;
    } else {
      approved = Math.random() < this.cardApprovalRate;
    }

    this.logger.log(
      `[MOCK] Cartão processado: orderId=${input.orderId} status=${approved ? 'approved' : 'rejected'} amount=${input.amount} installments=${input.installments}`,
    );

    const finalStatus: MockFinalStatus = approved ? 'approved' : 'rejected';
    this.webhookSimulator.simulateWebhook({
      externalId,
      delayMs: this.cardWebhookDelayMs,
      finalStatus,
    });

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

    const failureReason = input.cardToken.includes('_0001')
      ? 'cc_rejected_insufficient_amount'
      : rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];

    return {
      externalId,
      transactionId: '',
      status: 'rejected',
      cardLast4: last4,
      cardBrand: brand,
      cardHolderName: input.customerName,
      failureReason,
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    await this.simulateDelay(100, 300);

    const state = this.paymentStates.get(externalId) ?? 'pending';

    if (state === 'approved') {
      return {
        externalId,
        status: 'approved',
        paidAt: new Date(),
        transactionId: `mock_tx_${createId()}`,
      };
    }

    if (state === 'rejected') {
      const isPix = externalId.startsWith('mock_pix_');
      return {
        externalId,
        status: 'rejected',
        failureReason: isPix ? 'cc_rejected_other_reason' : undefined,
      };
    }

    return { externalId, status: 'pending' };
  }

  // Usado pelo WebhookSimulatorService antes de chamar handleWebhook
  markPaymentStatus(externalId: string, status: MockFinalStatus) {
    this.paymentStates.set(externalId, status);
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

    const totalAmount = Number(amount.toFixed(2));
    const options: InstallmentOption[] = [];

    for (let i = 1; i <= 5; i++) {
      options.push({
        installments: i,
        installmentAmount: Number((totalAmount / i).toFixed(2)),
        totalAmount,
        hasInterest: false,
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
