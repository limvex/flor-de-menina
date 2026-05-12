import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma, OrderStatus, Prisma, ReviewStatus } from '@flor/database';
import { LOW_STOCK_THRESHOLD } from '@flor/types';
import { DashboardPreset } from './dto/dashboard-summary.query';
import {
  addOneDayYmd,
  countInclusiveDays,
  eachYmdInclusive,
  subtractCalendarDaysFromYmd,
  toYmdInMaceio,
  ymdToUtcRange,
} from './maceio-date-range';

const BUSINESS_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function toNum(d: { toNumber(): number } | null | undefined): number {
  if (!d) return 0;
  return d.toNumber();
}

export type DashboardSummaryResult = {
  period: { preset: string; from: string; to: string };
  kpis: { revenue: number; ordersCount: number; averageTicket: number };
  revenueByDay: { date: string; revenue: number }[];
  topProducts: {
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    number: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
    customerName: string | null;
    customerEmail: string | null;
  }[];
  alerts: {
    lowStockCount: number;
    pendingReviewsCount: number;
    unattendedOrdersCount: number;
  };
};

@Injectable()
export class AdminDashboardService {
  resolvePeriod(
    preset: DashboardPreset,
    from?: string,
    to?: string,
  ): {
    start: Date;
    endExclusive: Date;
    presetLabel: string;
    fromYmd: string;
    toYmd: string;
  } {
    const now = new Date();
    const todayYmd = toYmdInMaceio(now);

    if (preset === DashboardPreset.CUSTOM) {
      if (!from || !to) {
        throw new BadRequestException(
          'preset=custom exige from e to (YYYY-MM-DD)',
        );
      }
      if (from > to) {
        throw new BadRequestException('from não pode ser maior que to');
      }
      const days = countInclusiveDays(from, to);
      if (days > 366) {
        throw new BadRequestException('Intervalo máximo de 366 dias');
      }
      const { start } = ymdToUtcRange(from);
      const { endExclusive } = ymdToUtcRange(to);
      return {
        start,
        endExclusive,
        presetLabel: preset,
        fromYmd: from,
        toYmd: to,
      };
    }

    if (preset === DashboardPreset.TODAY) {
      const { start, endExclusive } = ymdToUtcRange(todayYmd);
      return {
        start,
        endExclusive,
        presetLabel: preset,
        fromYmd: todayYmd,
        toYmd: todayYmd,
      };
    }

    const daysBack = preset === DashboardPreset.SEVEN_D ? 6 : 29;
    const startYmd = subtractCalendarDaysFromYmd(todayYmd, daysBack);
    const { start } = ymdToUtcRange(startYmd);
    const { endExclusive } = ymdToUtcRange(todayYmd);
    return {
      start,
      endExclusive,
      presetLabel: preset,
      fromYmd: startYmd,
      toYmd: todayYmd,
    };
  }

  async getSummary(
    preset: DashboardPreset,
    from?: string,
    to?: string,
  ): Promise<DashboardSummaryResult> {
    const { start, endExclusive, presetLabel, fromYmd, toYmd } =
      this.resolvePeriod(preset, from, to);

    const orderWhere: Prisma.OrderWhereInput = {
      status: { in: BUSINESS_STATUSES },
      createdAt: { gte: start, lt: endExclusive },
    };

    const [
      businessOrders,
      recentOrders,
      pendingReviewsCount,
      unattendedOrdersCount,
      lowRow,
    ] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        select: { id: true, total: true, createdAt: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.order.count({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] } },
      }),
      prisma.$queryRaw<{ c: number }[]>(Prisma.sql`
          SELECT COUNT(*)::int AS c FROM (
            SELECT p.id
            FROM "Product" p
            INNER JOIN "ProductVariant" v ON v."productId" = p.id AND v."isActive" = true
            WHERE p."deletedAt" IS NULL
            GROUP BY p.id
            HAVING BOOL_OR(v.stock > 0)
            AND BOOL_OR(v.stock > 0 AND v.stock < ${LOW_STOCK_THRESHOLD})
          ) sub
        `),
    ]);

    let revenue = 0;
    for (const o of businessOrders) {
      revenue += toNum(o.total);
    }
    const ordersCount = businessOrders.length;
    const averageTicket = ordersCount > 0 ? revenue / ordersCount : 0;

    const revenueByDayMap = new Map<string, number>();
    for (const ymd of eachYmdInclusive(fromYmd, toYmd)) {
      revenueByDayMap.set(ymd, 0);
    }
    for (const o of businessOrders) {
      const key = toYmdInMaceio(o.createdAt);
      if (revenueByDayMap.has(key)) {
        revenueByDayMap.set(
          key,
          (revenueByDayMap.get(key) ?? 0) + toNum(o.total),
        );
      }
    }
    const revenueByDay = [...revenueByDayMap.entries()].map(([date, rev]) => ({
      date,
      revenue: rev,
    }));

    const orderIds = businessOrders.map((o) => o.id);
    const topProducts = await this.computeTopProducts(orderIds);

    const lowStockCount = lowRow[0]?.c ?? 0;

    return {
      period: {
        preset: presetLabel,
        from: start.toISOString(),
        to: new Date(endExclusive.getTime() - 1).toISOString(),
      },
      kpis: {
        revenue: Math.round(revenue * 100) / 100,
        ordersCount,
        averageTicket: Math.round(averageTicket * 100) / 100,
      },
      revenueByDay,
      topProducts,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: Math.round(toNum(o.total) * 100) / 100,
        createdAt: o.createdAt.toISOString(),
        customerName: o.user.name,
        customerEmail: o.user.email,
      })),
      alerts: {
        lowStockCount,
        pendingReviewsCount,
        unattendedOrdersCount,
      },
    };
  }

  private async computeTopProducts(orderIds: string[]) {
    if (orderIds.length === 0) return [];

    const items = await prisma.orderItem.findMany({
      where: { orderId: { in: orderIds } },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        subtotal: true,
      },
    });

    const map = new Map<
      string,
      { name: string; unitsSold: number; revenue: number }
    >();

    for (const it of items) {
      const cur = map.get(it.productId) ?? {
        name: it.productName,
        unitsSold: 0,
        revenue: 0,
      };
      cur.unitsSold += it.quantity;
      cur.revenue += toNum(it.subtotal);
      if (!cur.name && it.productName) cur.name = it.productName;
      map.set(it.productId, cur);
    }

    const list = [...map.entries()].map(([productId, v]) => ({
      productId,
      name: v.name,
      unitsSold: v.unitsSold,
      revenue: Math.round(v.revenue * 100) / 100,
    }));

    list.sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      return b.revenue - a.revenue;
    });

    return list.slice(0, 5);
  }
}
