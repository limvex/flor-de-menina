import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { MercadoPagoWebhookController } from './webhooks/mercado-pago-webhook.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from './adapters/mercado-pago.adapter';
import { WebhookSimulatorService } from './webhooks/webhook-simulator.service';
import { StockModule } from '../modules/stock/stock.module';
import { CartModule } from '../modules/cart/cart.module';

@Module({
  imports: [ConfigModule, StockModule, CartModule],
  controllers: [PaymentsController, MercadoPagoWebhookController],
  providers: [
    PaymentsService,
    MockPaymentAdapter,
    MercadoPagoAdapter,
    WebhookSimulatorService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
