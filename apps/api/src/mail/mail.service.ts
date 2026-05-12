import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma, createId, EmailEventType, EmailStatus } from '@flor/database';
import { MAIL_QUEUE } from './mail.queue';

interface EnqueueInput {
  event: EmailEventType;
  recipientEmail: string;
  recipientName?: string;
  payload: Record<string, unknown>;
  userId?: string;
  orderId?: string;
}

const QUEUE_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
  ) {
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

  private buildIdempotencyKey(
    event: EmailEventType,
    identifier: string,
  ): string {
    return `${event.toLowerCase().replace(/_/g, '-')}-${identifier}`;
  }

  async enqueue(input: EnqueueInput): Promise<void> {
    const identifier = input.orderId ?? input.userId ?? input.recipientEmail;
    const idempotencyKey = this.buildIdempotencyKey(input.event, identifier);

    const existing = await prisma.emailLog.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.status === EmailStatus.SENT) {
      this.logger.log(`Email already sent, skipping: key=${idempotencyKey}`);
      return;
    }

    const subjectMap: Record<EmailEventType, string> = {
      [EmailEventType.EMAIL_VERIFICATION]:
        'Confirme seu e-mail — Flor de Menina',
      [EmailEventType.PASSWORD_RESET]: 'Redefinir senha — Flor de Menina',
      [EmailEventType.ORDER_CREATED]: `Pedido recebido — Flor de Menina`,
      [EmailEventType.PAYMENT_APPROVED]: `Pagamento confirmado — Flor de Menina`,
      [EmailEventType.PAYMENT_REJECTED]: `Problema no pagamento — Flor de Menina`,
      [EmailEventType.ORDER_SHIPPED]: `Pedido enviado — Flor de Menina`,
      [EmailEventType.ORDER_DELIVERED]: `Entrega confirmada — Flor de Menina`,
      [EmailEventType.REVIEW_INVITATION]: 'Avalie sua compra — Flor de Menina',
    };

    const log = await prisma.emailLog.upsert({
      where: { idempotencyKey },
      create: {
        id: createId(),
        event: input.event,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: subjectMap[input.event],
        status: EmailStatus.PENDING,
        idempotencyKey,
        payload: input.payload as object,
        userId: input.userId,
        orderId: input.orderId,
      },
      update: {
        status: EmailStatus.PENDING,
        attemptCount: 0,
        errorMessage: null,
      },
    });

    await this.mailQueue.add(input.event, { logId: log.id }, QUEUE_OPTS);
    this.logger.log(`Email enqueued: event=${input.event} logId=${log.id}`);
  }

  async sendVerification(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', this.appUrl);
    const verificationLink = `${frontendUrl}/verificar-email?token=${token}`;

    await this.enqueue({
      event: EmailEventType.EMAIL_VERIFICATION,
      recipientEmail: to,
      recipientName: name,
      payload: { name, verificationLink },
    });
  }

  async sendPasswordReset(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', this.appUrl);
    const resetLink = `${frontendUrl}/redefinir-senha?token=${token}`;

    await this.enqueue({
      event: EmailEventType.PASSWORD_RESET,
      recipientEmail: to,
      recipientName: name,
      payload: { name, resetLink },
    });
  }

  async sendOrderCreated(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        payment: true,
      },
    });

    if (!order) {
      this.logger.warn(`sendOrderCreated: order not found: ${orderId}`);
      return;
    }

    const paymentMethod =
      order.payment?.method === 'PIX' ? 'PIX' : 'CREDIT_CARD';

    await this.enqueue({
      event: EmailEventType.ORDER_CREATED,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        paymentMethod,
        pixCopyPaste: order.payment?.pixCopyPaste ?? undefined,
        items: order.items.map((i) => ({
          name: this.buildItemName(i),
          quantity: i.quantity,
          price: Number(i.unitPrice),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        discount: Number(order.discount),
        total: Number(order.total),
        appUrl: this.appUrl,
      },
    });
  }

  async sendPaymentApproved(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) {
      this.logger.warn(`sendPaymentApproved: order not found: ${orderId}`);
      return;
    }

    await this.enqueue({
      event: EmailEventType.PAYMENT_APPROVED,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        items: order.items.map((i) => ({
          name: this.buildItemName(i),
          quantity: i.quantity,
          price: Number(i.unitPrice),
        })),
        total: Number(order.total),
        appUrl: this.appUrl,
      },
    });
  }

  async sendPaymentRejected(orderId: string, reason?: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(`sendPaymentRejected: order not found: ${orderId}`);
      return;
    }

    await this.enqueue({
      event: EmailEventType.PAYMENT_REJECTED,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        reason,
        appUrl: this.appUrl,
      },
    });
  }

  async sendOrderShipped(
    orderId: string,
    trackingCode: string,
    estimatedDays?: number,
  ): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(`sendOrderShipped: order not found: ${orderId}`);
      return;
    }

    await this.enqueue({
      event: EmailEventType.ORDER_SHIPPED,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        trackingCode,
        estimatedDays,
        appUrl: this.appUrl,
      },
    });
  }

  async sendOrderDelivered(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn(`sendOrderDelivered: order not found: ${orderId}`);
      return;
    }

    await this.enqueue({
      event: EmailEventType.ORDER_DELIVERED,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        appUrl: this.appUrl,
      },
    });
  }

  async sendReviewInvitation(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  select: { cardUrl: true, url: true },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      this.logger.warn(`sendReviewInvitation: order not found: ${orderId}`);
      return;
    }

    const items = order.items.map((i) => ({
      name: this.buildItemName(i),
      imageUrl: i.product.images[0]?.cardUrl ?? i.product.images[0]?.url,
    }));

    await this.enqueue({
      event: EmailEventType.REVIEW_INVITATION,
      recipientEmail: order.user.email,
      recipientName: order.user.name,
      orderId,
      userId: order.userId,
      payload: {
        name: order.user.name,
        orderNumber: order.number,
        orderId,
        items,
        appUrl: this.appUrl,
      },
    });
  }

  private buildItemName(item: {
    productName: string;
    variantSize?: string | null;
    variantColor?: string | null;
  }): string {
    const parts = [item.variantSize, item.variantColor].filter(Boolean);
    return parts.length > 0
      ? `${item.productName} (${parts.join('/')})`
      : item.productName;
  }
}
