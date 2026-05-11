import { Controller, Post, Body, Headers, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../payments.service';

@Controller('webhooks')
export class MercadoPagoWebhookController {
  private readonly logger = new Logger(MercadoPagoWebhookController.name);

  constructor(private paymentsService: PaymentsService) {}

  @Post('mercado-pago')
  async handle(
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Req() req: Request,
  ) {
    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody?.toString() ||
      JSON.stringify(body);

    try {
      const result = await this.paymentsService.handleWebhook({
        rawBody,
        signature: signature || '',
        requestId: requestId || 'no-request-id',
        body,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook error: ${message}`);
      // Retorna 200 mesmo com erro para evitar retry infinito do MP
      return { error: true, message };
    }
  }
}
