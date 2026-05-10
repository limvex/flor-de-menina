import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayAdapter,
  PixPaymentResult,
  CardPaymentResult,
  PaymentStatusResult,
  InstallmentOption,
} from './payment-gateway.interface';

/**
 * Adapter real do Mercado Pago.
 * Implementação completa na Task #25 (go-live).
 * Esqueleto para ter assinatura correta e teste de DI.
 */
@Injectable()
export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);

  constructor(private config: ConfigService) {
    const accessToken = this.config.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.warn(
        'MercadoPagoAdapter instanciado sem MP_ACCESS_TOKEN — não funcional',
      );
      return;
    }
    // TODO(task-#25): inicializar cliente MP
    this.logger.log(
      'MercadoPagoAdapter inicializado (esqueleto — implementação real na #25)',
    );
  }

  async createPixPayment(
    _input: Parameters<PaymentGatewayAdapter['createPixPayment']>[0],
  ): Promise<PixPaymentResult> {
    throw new NotImplementedException(
      'MercadoPagoAdapter.createPixPayment será implementado na Task #25',
    );
  }

  async processCardPayment(
    _input: Parameters<PaymentGatewayAdapter['processCardPayment']>[0],
  ): Promise<CardPaymentResult> {
    throw new NotImplementedException(
      'MercadoPagoAdapter.processCardPayment será implementado na Task #25',
    );
  }

  async getPaymentStatus(_externalId: string): Promise<PaymentStatusResult> {
    throw new NotImplementedException(
      'MercadoPagoAdapter.getPaymentStatus será implementado na Task #25',
    );
  }

  validateWebhookSignature(_input: {
    rawBody: string;
    signature: string;
    requestId: string;
  }): boolean {
    // TODO(task-#25): implementar HMAC SHA-256 com MP_WEBHOOK_SECRET
    this.logger.warn(
      'validateWebhookSignature: implementação real fica pra Task #25',
    );
    return false;
  }

  async getInstallmentOptions(_amount: number): Promise<InstallmentOption[]> {
    throw new NotImplementedException(
      'MercadoPagoAdapter.getInstallmentOptions será implementado na Task #25',
    );
  }
}
