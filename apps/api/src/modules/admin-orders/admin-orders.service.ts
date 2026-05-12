import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@flor/database';
import type { ListAdminOrdersQuery } from './dto/list-admin-orders.query';

function toNum(d: { toNumber(): number } | null | undefined): number {
  if (!d) return 0;
  return d.toNumber();
}

@Injectable()
export class AdminOrdersService {
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
    };
  }
}
