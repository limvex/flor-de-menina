import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
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
import { StockService } from '../modules/stock/stock.service';
import { CartService } from '../modules/cart/cart.service';
import { EmailService } from '../email/email.service';
import { CouponsService } from '../modules/coupons/coupons.service';

type OrderWithUserAndPayment = Prisma.OrderGetPayload<{
  include: { user: true; payment: true };
}>;

type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: {
    order: { select: { id: true; number: true; status: true; userId: true } };
  };
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
    private stockService: StockService,
    private cartService: CartService,
    private emailService: EmailService,
    private couponsService: CouponsService,
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

  async processPayment(
    input: {
      orderId: string;
      method: 'PIX' | 'CREDIT_CARD';
      cardToken?: string;
      paymentMethodId?: string;
      installments?: number;
    },
    userId: string,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { user: true, payment: true },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (order.userId !== userId) {
      throw new ForbiddenException('Pedido não pertence ao usuário');
    }

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
        provider: this.providerName,
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
        provider: this.providerName,
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

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: { id: true, number: true, status: true, userId: true },
        },
      },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (payment.order.userId !== userId) {
      throw new ForbiddenException('Pagamento não pertence ao usuário');
    }

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
          ...(newStatus === PaymentStatus.REJECTED ||
          newStatus === PaymentStatus.CANCELLED
            ? {
                failureReason:
                  gatewayStatus.failureReason ?? payment.failureReason ?? null,
              }
            : {}),
        },
        include: {
          order: {
            select: { id: true, number: true, status: true, userId: true },
          },
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

  /** Chave pública (somente) para Bricks no browser — mesmas vars do `.env` da API. */
  getMpBricksPublicKey(): { publicKey: string } {
    const raw =
      this.config.get<string>('NEXT_PUBLIC_MP_PUBLIC_KEY') ||
      this.config.get<string>('MP_PUBLIC_KEY') ||
      '';
    return { publicKey: raw.trim() };
  }

  async handleWebhook(input: {
    rawBody: string;
    signature: string;
    requestId: string;
    body: Record<string, unknown>;
  }) {
    const bodyData = input.body.data as Record<string, unknown> | undefined;
    const dataId: string | undefined = bodyData?.id
      ? String(bodyData.id)
      : undefined;

    const valid = this.adapter.validateWebhookSignature({
      rawBody: input.rawBody,
      signature: input.signature,
      requestId: input.requestId,
      dataId,
    });

    if (!valid) {
      this.logger.warn(
        `Webhook com assinatura inválida: requestId=${input.requestId}`,
      );
      throw new UnauthorizedException('Invalid signature');
    }

    const eventType: string =
      (input.body.action as string) || (input.body.type as string) || 'unknown';
    const externalEventIdRaw = String(input.body.id ?? '');
    const externalEventId: string = externalEventIdRaw || input.requestId;

    if (!dataId) {
      this.logger.warn(`Webhook sem data.id: ${eventType}`);
      return { skipped: true, reason: 'no_data_id' };
    }

    const gatewayStatus = await this.adapter.getPaymentStatus(dataId);
    const newStatus = this.mapAdapterStatus(gatewayStatus.status);

    const txResult = await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { externalId: dataId },
          include: {
            order: {
              select: {
                id: true,
                userId: true,
                number: true,
                status: true,
                total: true,
              },
            },
          },
        });

        if (!payment) {
          this.logger.warn(
            `Webhook: payment não encontrado externalId=${dataId}`,
          );
          return { skipped: true, reason: 'payment_not_found' as const };
        }

        const existingEvent = await tx.paymentEvent.findUnique({
          where: { externalEventId },
        });

        if (existingEvent?.processed) {
          this.logger.log(
            `Webhook idempotente — evento já processado: ${externalEventId}`,
          );
          return {
            skipped: true,
            reason: 'already_processed' as const,
            paymentId: payment.id,
            newStatus,
          };
        }

        const event = await tx.paymentEvent.upsert({
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

        const paymentUpdateData: Record<string, unknown> = {
          status: newStatus,
          paidAt:
            newStatus === PaymentStatus.APPROVED ? new Date() : payment.paidAt,
          transactionId: gatewayStatus.transactionId || payment.transactionId,
        };

        if (
          newStatus === PaymentStatus.REJECTED ||
          newStatus === PaymentStatus.CANCELLED
        ) {
          paymentUpdateData.failureReason =
            gatewayStatus.failureReason ?? payment.failureReason ?? null;
        }

        // Atualiza Payment e Order (mesmo que status já esteja igual),
        // garantindo que o ciclo de finalização rode 1x por evento.
        await tx.payment.update({
          where: { id: payment.id },
          data: paymentUpdateData as any,
        });

        if (newStatus === PaymentStatus.APPROVED) {
          await this.stockService.decrementStockForOrder(payment.orderId, tx);
          await this.cartService.clearCart(payment.order.userId, tx);

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.PAID },
          });
        }

        if (
          newStatus === PaymentStatus.REJECTED ||
          newStatus === PaymentStatus.CANCELLED
        ) {
          await this.stockService.restoreStockForOrder(payment.orderId, tx);
          await this.cartService.clearCart(payment.order.userId, tx);
          await this.couponsService.reverseCouponUsage(tx, payment.orderId);

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.CANCELLED },
          });
        }

        if (newStatus === PaymentStatus.REFUNDED) {
          await this.stockService.restoreStockForOrder(payment.orderId, tx);
          await this.couponsService.reverseCouponUsage(tx, payment.orderId);

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.REFUNDED },
          });
        }

        await tx.paymentEvent.update({
          where: { id: event.id },
          data: { processed: true, processedAt: new Date() },
        });

        return {
          skipped: false as const,
          paymentId: payment.id,
          orderId: payment.orderId,
          newStatus,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      },
    );

    if (txResult.skipped) {
      return { skipped: true, reason: txResult.reason };
    }

    const fullOrder = await prisma.order.findUnique({
      where: { id: txResult.orderId },
      include: {
        user: true,
        items: true,
        payment: true,
      },
    });

    if (!fullOrder) {
      this.logger.warn(
        `Webhook: order não encontrada após transação orderId=${txResult.orderId}`,
      );
      return { ok: true, paymentId: txResult.paymentId, newStatus };
    }

    if (txResult.newStatus === PaymentStatus.APPROVED) {
      this.emailService.sendPaymentApproved(fullOrder.id).catch((err) => {
        this.logger.error(
          `sendPaymentApproved falhou: orderId=${fullOrder.id} error=${String(err)}`,
        );
      });
    } else if (
      txResult.newStatus === PaymentStatus.REJECTED ||
      txResult.newStatus === PaymentStatus.CANCELLED
    ) {
      this.emailService
        .sendPaymentFailure({
          orderId: fullOrder.id,
          orderNumber: fullOrder.number,
          customerName: fullOrder.user.name,
          customerEmail: fullOrder.user.email,
          reason:
            fullOrder.payment?.failureReason ??
            'Pagamento não autorizado pelo banco',
        })
        .catch((err) => {
          this.logger.error(
            `sendPaymentFailure falhou: orderId=${fullOrder.id} error=${String(err)}`,
          );
        });
    } else if (txResult.newStatus === PaymentStatus.REFUNDED) {
      this.emailService
        .sendRefund({
          orderId: fullOrder.id,
          orderNumber: fullOrder.number,
          customerName: fullOrder.user.name,
          customerEmail: fullOrder.user.email,
          amount: Number(fullOrder.payment?.amount ?? 0),
        })
        .catch((err) => {
          this.logger.error(
            `sendRefund falhou: orderId=${fullOrder.id} error=${String(err)}`,
          );
        });
    }

    this.logger.log(
      `Webhook processado: paymentId=${txResult.paymentId} status=${txResult.newStatus}`,
    );

    return {
      ok: true,
      paymentId: txResult.paymentId,
      newStatus: txResult.newStatus,
    };
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
