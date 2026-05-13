import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createId, OrderStatus, PaymentStatus, prisma } from '@flor/database';
import { EmailService } from '../../email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { StockService } from '../stock/stock.service';
import type { ListAdminOrdersQuery } from './dto/list-admin-orders.query';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';

function toNum(d: { toNumber(): number } | null | undefined): number {
  if (!d) return 0;
  return d.toNumber();
}

function buildTrackingUrl(trackingCode: string): string {
  return `https://t.17track.net/pt#nums=${encodeURIComponent(trackingCode)}`;
}

function shippingAddressToSummary(address: unknown): string {
  if (!address || typeof address !== 'object') return '—';
  const a = address as Record<string, unknown>;
  const parts = [
    a.street,
    a.number,
    a.complement,
    a.neighborhood,
    a.city,
    a.state,
    a.postalCode,
  ].filter((x) => x != null && String(x).trim() !== '');
  return parts.length ? parts.map(String).join(', ') : '—';
}

function formatEstimatedDelivery(
  estimatedDays: number | null | undefined,
): string | undefined {
  if (
    estimatedDays == null ||
    !Number.isFinite(estimatedDays) ||
    estimatedDays <= 0
  ) {
    return undefined;
  }
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(estimatedDays));
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly stockService: StockService,
    private readonly couponsService: CouponsService,
    private readonly emailService: EmailService,
  ) {}

  getValidTransitions(status: OrderStatus): OrderStatus[] {
    switch (status) {
      case OrderStatus.PAID:
        return [OrderStatus.PROCESSING, OrderStatus.CANCELLED];
      case OrderStatus.PROCESSING:
        return [OrderStatus.SHIPPED, OrderStatus.CANCELLED];
      case OrderStatus.SHIPPED:
        return [OrderStatus.DELIVERED];
      case OrderStatus.PENDING:
        return [OrderStatus.CANCELLED];
      default:
        return [];
    }
  }

  async getValidTransitionsForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return {
      current: order.status,
      validNext: this.getValidTransitions(order.status),
    };
  }

  async list(query: ListAdminOrdersQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = query.status ? { status: query.status } : {};

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items: rows.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: Math.round(toNum(o.total) * 100) / 100,
        createdAt: o.createdAt.toISOString(),
        customerName: o.user.name,
        customerEmail: o.user.email,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        shipping: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      cpf: order.cpf,
      subtotal: Math.round(toNum(order.subtotal) * 100) / 100,
      shippingCost: Math.round(toNum(order.shippingCost) * 100) / 100,
      discount: Math.round(toNum(order.discount) * 100) / 100,
      total: Math.round(toNum(order.total) * 100) / 100,
      shippingAddress: order.shippingAddress,
      couponCode: order.couponCode,
      notes: order.notes,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        variantId: it.variantId,
        productName: it.productName,
        variantSize: it.variantSize,
        variantColor: it.variantColor,
        productImageUrl: it.productImageUrl,
        unitPrice: Math.round(toNum(it.unitPrice) * 100) / 100,
        quantity: it.quantity,
        subtotal: Math.round(toNum(it.subtotal) * 100) / 100,
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            method: order.payment.method,
            status: order.payment.status,
            amount: Math.round(toNum(order.payment.amount) * 100) / 100,
            installments: order.payment.installments,
            paidAt: order.payment.paidAt?.toISOString() ?? null,
            failureReason: order.payment.failureReason,
            pixCopyPaste: order.payment.pixCopyPaste,
            pixExpiresAt: order.payment.pixExpiresAt?.toISOString() ?? null,
          }
        : null,
      shipping: order.shipping
        ? {
            id: order.shipping.id,
            serviceName: order.shipping.serviceName,
            trackingCode: order.shipping.trackingCode,
            estimatedDays: order.shipping.estimatedDays,
            cost: Math.round(toNum(order.shipping.cost) * 100) / 100,
            shippedAt: order.shipping.shippedAt?.toISOString() ?? null,
            deliveredAt: order.shipping.deliveredAt?.toISOString() ?? null,
          }
        : null,
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        notes: h.notes,
        changedByUserId: h.changedByUserId,
        at: h.createdAt.toISOString(),
      })),
    };
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminUserId: string,
  ) {
    const notify = dto.notifyCustomer !== false;
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true, items: true, shipping: true, user: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      const transitions = this.getValidTransitions(order.status);
      if (!transitions.includes(dto.status)) {
        throw new BadRequestException(
          `Transição inválida: de ${order.status} para ${dto.status}. Próximos permitidos: ${transitions.length ? transitions.join(', ') : 'nenhum'}.`,
        );
      }

      const operationalTargets: OrderStatus[] = [
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ];
      if (operationalTargets.includes(dto.status)) {
        if (order.payment?.status !== PaymentStatus.APPROVED) {
          throw new BadRequestException('Pedido com pagamento não aprovado');
        }
      }

      if (dto.status === OrderStatus.CANCELLED) {
        if (
          order.status === OrderStatus.SHIPPED ||
          order.status === OrderStatus.DELIVERED
        ) {
          throw new BadRequestException(
            'Use o fluxo de reembolso para pedidos já enviados',
          );
        }
        if (
          order.status !== OrderStatus.PENDING &&
          order.payment?.status !== PaymentStatus.APPROVED
        ) {
          throw new BadRequestException('Pedido com pagamento não aprovado');
        }
      }

      if (dto.status === OrderStatus.SHIPPED) {
        const code = dto.trackingCode?.trim();
        if (!code) {
          throw new BadRequestException(
            'trackingCode obrigatório para status SHIPPED',
          );
        }
      }

      const data: {
        status: OrderStatus;
        trackingCode?: string | null;
        shippedAt?: Date | null;
        deliveredAt?: Date | null;
      } = { status: dto.status };

      if (dto.status === OrderStatus.SHIPPED) {
        data.trackingCode = dto.trackingCode!.trim();
        data.shippedAt = new Date();
      }

      if (dto.status === OrderStatus.DELIVERED) {
        data.deliveredAt = new Date();
      }

      await tx.order.update({
        where: { id: orderId },
        data,
      });

      await tx.orderStatusHistory.create({
        data: {
          id: createId(),
          orderId,
          fromStatus: order.status,
          toStatus: dto.status,
          notes: dto.notes?.trim() || null,
          changedByUserId: adminUserId,
        },
      });

      if (dto.status === OrderStatus.CANCELLED) {
        await this.stockService.restoreStockForOrder(orderId, tx);
        await this.couponsService.reverseCouponUsage(tx, orderId);
      }
    });

    const fresh = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        shipping: true,
        user: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!fresh) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (notify) {
      await this.fireStatusEmail(fresh, dto.status, {
        cancelNotes: dto.notes?.trim() || undefined,
      });
    }

    const trackingCode = fresh.trackingCode ?? null;
    const trackingUrl = trackingCode ? buildTrackingUrl(trackingCode) : null;

    return {
      id: fresh.id,
      number: fresh.number,
      status: fresh.status,
      trackingCode,
      trackingUrl,
      updatedAt: fresh.updatedAt.toISOString(),
      notifiedCustomer: notify,
      history: fresh.statusHistory.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        at: h.createdAt.toISOString(),
        notes: h.notes,
      })),
    };
  }

  private async fireStatusEmail(
    order: {
      id: string;
      number: string;
      user: { name: string; email: string };
      items: Array<{
        productName: string;
        variantSize: string | null;
        variantColor: string | null;
        quantity: number;
        productImageUrl: string | null;
      }>;
      shippingAddress: unknown;
      shipping: {
        serviceName: string;
        estimatedDays: number | null;
      } | null;
      trackingCode: string | null;
    },
    status: OrderStatus,
    opts?: { cancelNotes?: string },
  ): Promise<void> {
    const itemsPayload = order.items.map((it) => {
      const parts = [it.variantColor, it.variantSize].filter(Boolean);
      const name =
        parts.length > 0
          ? `${it.productName} (${parts.join(' · ')})`
          : it.productName;
      return {
        name,
        quantity: it.quantity,
        imageUrl: it.productImageUrl,
      };
    });

    const addrSummary = shippingAddressToSummary(order.shippingAddress);
    const shippingMethod = order.shipping?.serviceName ?? 'Envio';
    const est = formatEstimatedDelivery(order.shipping?.estimatedDays ?? null);

    try {
      if (status === OrderStatus.SHIPPED && order.trackingCode) {
        await this.emailService.sendOrderShipped({
          orderId: order.id,
          orderNumber: order.number,
          customerName: order.user.name,
          customerEmail: order.user.email,
          trackingCode: order.trackingCode,
          trackingUrl: buildTrackingUrl(order.trackingCode),
          shippingMethod,
          estimatedDays: order.shipping?.estimatedDays ?? null,
          estimatedDeliveryLabel: est,
          items: itemsPayload,
          shippingAddressSummary: addrSummary,
        });
      } else if (status === OrderStatus.DELIVERED) {
        await this.emailService.sendOrderDelivered({
          orderId: order.id,
          orderNumber: order.number,
          customerName: order.user.name,
          customerEmail: order.user.email,
          items: itemsPayload,
          shippingAddressSummary: addrSummary,
        });
      } else if (status === OrderStatus.CANCELLED) {
        await this.emailService.sendOrderCancelled({
          orderId: order.id,
          orderNumber: order.number,
          customerName: order.user.name,
          customerEmail: order.user.email,
          reason: opts?.cancelNotes,
        });
      }
    } catch (err) {
      this.logger.error(
        `fireStatusEmail falhou order=${order.id} status=${status} err=${String(err)}`,
      );
    }
  }
}
