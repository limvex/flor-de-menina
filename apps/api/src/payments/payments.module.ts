import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { MercadoPagoWebhookController } from './webhooks/mercado-pago-webhook.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from './adapters/mercado-pago.adapter';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController, MercadoPagoWebhookController],
  providers: [PaymentsService, MockPaymentAdapter, MercadoPagoAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}
