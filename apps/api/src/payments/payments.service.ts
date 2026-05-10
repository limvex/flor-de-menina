import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  prisma,
  createId,
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  Prisma,
} from '@flor/database';
import { PaymentGatewayAdapter } from './adapters/payment-gateway.interface';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from './adapters/mercado-pago.adapter';
import { sanitizeForLog } from './utils/sanitize-logs';

type OrderWithUserAndPayment = Prisma.OrderGetPayload<{
  include: { user: true; payment: true };
}>;

type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: { order: { select: { id: true; number: true; status: true } } };
}>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly adapter: PaymentGatewayAdapter;
  private readonly providerName: PaymentProvider;

  constructor(
    private config: ConfigService,
    private mockAdapter: MockPaymentAdapter,
    private mpAdapter: MercadoPagoAdapter,
  ) {
    const provider = this.config.get<string>('PAYMENT_PROVIDER', 'mock');

    if (provider === 'mercado_pago') {
      this.adapter = this.mpAdapter;
      this.providerName = PaymentProvider.MERCADO_PAGO;
      this.logger.log('PaymentsService: usando MercadoPagoAdapter');
    } else {
      this.adapter = this.mockAdapter;
      this.providerName = PaymentProvider.MOCK;
      this.logger.log('PaymentsService: usando MockPaymentAdapter');
    }
  }

  async processPayment(input: {
    orderId: string;
    method: 'PIX' | 'CREDIT_CARD';
    cardToken?: string;
    paymentMethodId?: string;
    installments?: number;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { user: true, payment: true },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Pedido com status ${order.status} não pode ser pago`,
      );
    }

    if (order.payment && order.payment.status === PaymentStatus.APPROVED) {
      throw new BadRequestException('Pedido já foi pago');
    }

    if (input.method === 'PIX') {
      return this.processPix(order, input.installments ?? 1);
    }

    if (input.method === 'CREDIT_CARD') {
      if (!input.cardToken) {
        throw new BadRequestException(
          'cardToken obrigatório para cartão de crédito',
        );
      }
      return this.processCard(
        order,
        input.cardToken,
        input.paymentMethodId,
        input.installments ?? 1,
      );
    }

    throw new BadRequestException(
      `Método de pagamento inválido: ${input.method}`,
    );
  }

  private async processPix(
    order: OrderWithUserAndPayment,
    installments: number,
  ) {
    const result = await this.adapter.createPixPayment({
      orderId: order.id,
      amount: Number(order.total),
      customerEmail: order.user.email,
      customerName: order.user.name,
      customerCpf: order.user.cpf || '',
      description: `Pedido ${order.number} - Flor de Menina`,
    });

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        id: createId(),
        orderId: order.id,
        provider: this.providerName,
        method: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        amount: order.total,
        installments,
        externalId: result.externalId,
        pixQrCode: result.qrCode,
        pixQrCodeBase64: result.qrCodeBase64,
        pixCopyPaste: result.copyPaste,
        pixExpiresAt: result.expiresAt,
        metadata: sanitizeForLog(result) as Prisma.InputJsonValue,
      },
      update: {
        status: PaymentStatus.PENDING,
        externalId: result.externalId,
        pixQrCode: result.qrCode,
        pixQrCodeBase64: result.qrCodeBase64,
        pixCopyPaste: result.copyPaste,
        pixExpiresAt: result.expiresAt,
      },
    });

    this.logger.log(`PIX criado: paymentId=${payment.id} orderId=${order.id}`);

    return {
      paymentId: payment.id,
      method: 'PIX' as const,
      status: payment.status,
      pix: {
        qrCode: result.qrCode,
        qrCodeBase64: result.qrCodeBase64,
        copyPaste: result.copyPaste,
        expiresAt: result.expiresAt,
      },
    };
  }

  private async processCard(
    order: OrderWithUserAndPayment,
    cardToken: string,
    paymentMethodId: string | undefined,
    installments: number,
  ) {
    const result = await this.adapter.processCardPayment({
      orderId: order.id,
      amount: Number(order.total),
      installments,
      cardToken,
      paymentMethodId: paymentMethodId || 'unknown',
      customerEmail: order.user.email,
      customerName: order.user.name,
      customerCpf: order.user.cpf || '',
      description: `Pedido ${order.number} - Flor de Menina`,
    });

    const status = this.mapAdapterStatus(result.status);

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        id: createId(),
        orderId: order.id,
        provider: this.providerName,
        method: PaymentMethod.CREDIT_CARD,
        status,
        amount: order.total,
        installments,
        externalId: result.externalId,
        transactionId: result.transactionId || null,
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand,
        cardHolderName: result.cardHolderName,
        failureReason: result.failureReason || null,
        paidAt: status === PaymentStatus.APPROVED ? new Date() : null,
        metadata: sanitizeForLog(result) as Prisma.InputJsonValue,
      },
      update: {
        status,
        externalId: result.externalId,
        transactionId: result.transactionId || null,
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand,
        cardHolderName: result.cardHolderName,
        failureReason: result.failureReason || null,
        paidAt: status === PaymentStatus.APPROVED ? new Date() : null,
      },
    });

    if (status === PaymentStatus.APPROVED) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });
    }

    this.logger.log(
      `Cartão processado: paymentId=${payment.id} orderId=${order.id} status=${status}`,
    );

    return {
      paymentId: payment.id,
      method: 'CREDIT_CARD' as const,
      status: payment.status,
      card: {
        last4: result.cardLast4,
        brand: result.cardBrand,
        installments,
      },
      failureReason: result.failureReason,
    };
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, number: true, status: true } } },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    const terminalStatuses: PaymentStatus[] = [
      PaymentStatus.APPROVED,
      PaymentStatus.REJECTED,
      PaymentStatus.REFUNDED,
    ];

    if (terminalStatuses.includes(payment.status)) {
      return this.formatStatusResponse(payment);
    }

    if (!payment.externalId) return this.formatStatusResponse(payment);

    const gatewayStatus = await this.adapter.getPaymentStatus(
      payment.externalId,
    );
    const newStatus = this.mapAdapterStatus(gatewayStatus.status);

    if (newStatus !== payment.status) {
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          paidAt:
            newStatus === PaymentStatus.APPROVED ? new Date() : payment.paidAt,
          transactionId: gatewayStatus.transactionId || payment.transactionId,
        },
        include: {
          order: { select: { id: true, number: true, status: true } },
        },
      });

      if (newStatus === PaymentStatus.APPROVED) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.PAID },
        });
      }

      this.logger.log(
        `Status atualizado via polling: paymentId=${paymentId} ${payment.status}→${newStatus}`,
      );

      return this.formatStatusResponse(updated);
    }

    return this.formatStatusResponse(payment);
  }

  async getInstallmentOptions(amount: number) {
    if (amount <= 0) throw new BadRequestException('amount deve ser positivo');
    return this.adapter.getInstallmentOptions(amount);
  }

  async handleWebhook(input: {
    rawBody: string;
    signature: string;
    requestId: string;
    body: Record<string, unknown>;
  }) {
    const valid = this.adapter.validateWebhookSignature({
      rawBody: input.rawBody,
      signature: input.signature,
      requestId: input.requestId,
    });

    if (!valid) {
      this.logger.warn(
        `Webhook com assinatura inválida: requestId=${input.requestId}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const eventType: string =
      (input.body.action as string) || (input.body.type as string) || 'unknown';
    const externalEventIdRaw = String(input.body.id ?? '');
    const externalEventId: string = externalEventIdRaw || input.requestId;
    const bodyData = input.body.data as Record<string, unknown> | undefined;
    const dataId: string | undefined = bodyData?.id
      ? String(bodyData.id)
      : undefined;

    if (!dataId) {
      this.logger.warn(`Webhook sem data.id: ${eventType}`);
      return { skipped: true, reason: 'no_data_id' };
    }

    const payment = await prisma.payment.findFirst({
      where: { externalId: dataId },
    });

    if (!payment) {
      this.logger.warn(`Webhook: payment não encontrado externalId=${dataId}`);
      return { skipped: true, reason: 'payment_not_found' };
    }

    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { externalEventId },
    });

    if (existingEvent?.processed) {
      this.logger.log(
        `Webhook idempotente — evento já processado: ${externalEventId}`,
      );
      return { skipped: true, reason: 'already_processed' };
    }

    const event = await prisma.paymentEvent.upsert({
      where: { externalEventId },
      create: {
        id: createId(),
        paymentId: payment.id,
        eventType,
        externalEventId,
        rawPayload: sanitizeForLog(input.body) as Prisma.InputJsonValue,
        processed: false,
      },
      update: {
        rawPayload: sanitizeForLog(input.body) as Prisma.InputJsonValue,
      },
    });

    const gatewayStatus = await this.adapter.getPaymentStatus(dataId);
    const newStatus = this.mapAdapterStatus(gatewayStatus.status);

    if (newStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt:
            newStatus === PaymentStatus.APPROVED ? new Date() : payment.paidAt,
          transactionId: gatewayStatus.transactionId || payment.transactionId,
        },
      });

      if (newStatus === PaymentStatus.APPROVED) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.PAID },
        });
        // TODO(task-#19): triggerar StockService.decrementStockForOrder + e-mail
      }

      if (
        newStatus === PaymentStatus.REJECTED ||
        newStatus === PaymentStatus.CANCELLED
      ) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CANCELLED },
        });
        // TODO(task-#19): StockService.restoreStockForOrder
      }
    }

    await prisma.paymentEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    this.logger.log(
      `Webhook processado: paymentId=${payment.id} status=${newStatus}`,
    );

    return { ok: true, paymentId: payment.id, newStatus };
  }

  private mapAdapterStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      in_process: PaymentStatus.IN_PROCESS,
      approved: PaymentStatus.APPROVED,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };
    return map[status] ?? PaymentStatus.PENDING;
  }

  private formatStatusResponse(payment: PaymentWithOrder) {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.number,
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt,
      pix:
        payment.method === PaymentMethod.PIX
          ? {
              qrCode: payment.pixQrCode,
              qrCodeBase64: payment.pixQrCodeBase64,
              copyPaste: payment.pixCopyPaste,
              expiresAt: payment.pixExpiresAt,
            }
          : undefined,
      card:
        payment.method === PaymentMethod.CREDIT_CARD
          ? {
              last4: payment.cardLast4,
              brand: payment.cardBrand,
              installments: payment.installments,
            }
          : undefined,
      failureReason: payment.failureReason,
    };
  }
}
