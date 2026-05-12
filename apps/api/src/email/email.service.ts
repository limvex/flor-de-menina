import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import type {
  OrderConfirmationEmailPayload,
  PaymentFailureEmailPayload,
  RefundEmailPayload,
} from './interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailService: MailService) {}

  async sendOrderConfirmation(payload: OrderConfirmationEmailPayload) {
    this.logger.log(
      `[EMAIL] order_confirmation order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    await this.mailService.sendPaymentApproved(payload.orderId);
  }

  async sendPaymentFailure(payload: PaymentFailureEmailPayload) {
    this.logger.log(
      `[EMAIL] payment_failure order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    await this.mailService.sendPaymentRejected(payload.orderId, payload.reason);
  }

  async sendRefund(payload: RefundEmailPayload) {
    this.logger.log(
      `[EMAIL] refund order=${payload.orderNumber} to=${payload.customerEmail} amount=${payload.amount}`,
    );
    // Reembolso: notifica com email de pagamento rejeitado adaptado
    await this.mailService.sendPaymentRejected(
      payload.orderId,
      `Reembolso de R$ ${payload.amount.toFixed(2)} processado.`,
    );
  }
}
