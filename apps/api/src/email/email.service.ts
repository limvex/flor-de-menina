import { Injectable, Logger } from '@nestjs/common';
import type {
  OrderConfirmationEmailPayload,
  PaymentFailureEmailPayload,
  RefundEmailPayload,
} from './interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  // TODO(task-#22): integrar Resend real
  async sendOrderConfirmation(payload: OrderConfirmationEmailPayload) {
    this.logger.log(
      `[EMAIL_TRIGGER] type=order_confirmation order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    this.logger.debug(JSON.stringify(payload, null, 2));
  }

  async sendPaymentFailure(payload: PaymentFailureEmailPayload) {
    this.logger.log(
      `[EMAIL_TRIGGER] type=payment_failure order=${payload.orderNumber} to=${payload.customerEmail} reason=${payload.reason}`,
    );
    this.logger.debug(JSON.stringify(payload, null, 2));
  }

  async sendRefund(payload: RefundEmailPayload) {
    this.logger.log(
      `[EMAIL_TRIGGER] type=refund order=${payload.orderNumber} to=${payload.customerEmail} amount=${payload.amount}`,
    );
    this.logger.debug(JSON.stringify(payload, null, 2));
  }
}
