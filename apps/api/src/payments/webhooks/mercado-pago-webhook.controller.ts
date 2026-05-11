import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../payments.service';

@Controller('webhooks')
export class MercadoPagoWebhookController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('mercado-pago')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Req() req: Request,
  ) {
    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody?.toString() ||
      JSON.stringify(body);

    return this.paymentsService.handleWebhook({
      rawBody,
      signature: signature || '',
      requestId: requestId || 'no-request-id',
      body,
    });
  }
}
