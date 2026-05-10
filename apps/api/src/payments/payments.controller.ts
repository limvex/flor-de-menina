import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseFloatPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { CustomerJwtGuard } from '../auth/customer/customer-jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('process')
  @UseGuards(CustomerJwtGuard)
  async process(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment({
      orderId: dto.orderId,
      method: dto.method,
      cardToken: dto.cardToken,
      paymentMethodId: dto.paymentMethodId,
      installments: dto.installments,
    });
  }

  @Get('installments')
  async getInstallments(@Query('amount', ParseFloatPipe) amount: number) {
    return this.paymentsService.getInstallmentOptions(amount);
  }

  @Get(':id/status')
  @UseGuards(CustomerJwtGuard)
  async getStatus(@Param('id') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }
}
