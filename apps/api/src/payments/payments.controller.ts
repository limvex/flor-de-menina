import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseFloatPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { CustomerJwtGuard } from '../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';

@Controller('payments')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('process')
  @UseGuards(CustomerJwtGuard)
  async process(@CurrentUser() user: User, @Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(
      {
        orderId: dto.orderId,
        method: dto.method,
        cardToken: dto.cardToken,
        paymentMethodId: dto.paymentMethodId,
        installments: dto.installments,
      },
      user.id,
    );
  }

  @Get('installments')
  async getInstallments(@Query('amount', ParseFloatPipe) amount: number) {
    return this.paymentsService.getInstallmentOptions(amount);
  }

  /** Público: chave pública MP para o SDK React no checkout (evita falha de inline do Next). */
  @Get('sdk-config')
  getMpSdkConfig() {
    return this.paymentsService.getMpBricksPublicKey();
  }

  @Get(':id/status')
  @UseGuards(CustomerJwtGuard)
  async getStatus(@CurrentUser() user: User, @Param('id') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId, user.id);
  }
}
