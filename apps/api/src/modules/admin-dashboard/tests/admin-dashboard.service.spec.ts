import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@flor/database';
import { AdminDashboardService } from '../admin-dashboard.service';
import { DashboardPreset } from '../dto/dashboard-summary.query';

jest.mock('@flor/database', () => {
  const actual = jest.requireActual('@flor/database');
  return {
    ...actual,
    prisma: {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      orderItem: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
    },
  };
});

import { prisma } from '@flor/database';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminDashboardService();
  });

  it('resolvePeriod custom lança se from > to', () => {
    expect(() =>
      service.resolvePeriod(DashboardPreset.CUSTOM, '2026-05-10', '2026-05-09'),
    ).toThrow(BadRequestException);
  });

  it('resolvePeriod custom lança se intervalo > 366 dias', () => {
    expect(() =>
      service.resolvePeriod(DashboardPreset.CUSTOM, '2025-01-01', '2026-06-30'),
    ).toThrow(BadRequestException);
  });

  it('getSummary: ticket médio 0 quando não há pedidos de negócio', async () => {
    (prisma.order.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // business
      .mockResolvedValueOnce([]); // recent
    (prisma.order.count as jest.Mock).mockResolvedValue(0);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ c: 0 }]);

    const r = await service.getSummary(DashboardPreset.TODAY);

    expect(r.kpis.ordersCount).toBe(0);
    expect(r.kpis.averageTicket).toBe(0);
    expect(r.kpis.revenue).toBe(0);
    expect(r.topProducts).toEqual([]);
    expect(r.alerts.lowStockCount).toBe(0);
    expect(r.alerts.unattendedOrdersCount).toBe(0);
    const recentCall = (prisma.order.findMany as jest.Mock).mock.calls[1][0];
    expect(recentCall.where).toEqual(
      expect.objectContaining({
        createdAt: expect.objectContaining({
          gte: expect.any(Date),
          lt: expect.any(Date),
        }),
      }),
    );
  });

  it('getSummary: agrega receita e top produtos', async () => {
    const t0 = new Date('2026-05-10T15:00:00.000Z');
    (prisma.order.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'o1', total: { toNumber: () => 100 }, createdAt: t0 },
        { id: 'o2', total: { toNumber: () => 50 }, createdAt: t0 },
      ])
      .mockResolvedValueOnce([
        {
          id: 'o2',
          number: 'FDM-2',
          status: OrderStatus.PAID,
          total: { toNumber: () => 50 },
          createdAt: t0,
          user: { name: 'Ana', email: 'a@b.com' },
        },
      ]);
    (prisma.order.count as jest.Mock).mockResolvedValue(3);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ c: 1 }]);
    (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([
      {
        productId: 'p1',
        productName: 'Vestido',
        quantity: 2,
        subtotal: { toNumber: () => 80 },
      },
      {
        productId: 'p1',
        productName: 'Vestido',
        quantity: 1,
        subtotal: { toNumber: () => 40 },
      },
      {
        productId: 'p2',
        productName: 'Saia',
        quantity: 1,
        subtotal: { toNumber: () => 30 },
      },
    ]);

    const r = await service.getSummary(
      DashboardPreset.CUSTOM,
      '2026-05-10',
      '2026-05-10',
    );

    expect(r.kpis.revenue).toBe(150);
    expect(r.kpis.ordersCount).toBe(2);
    expect(r.kpis.averageTicket).toBe(75);
    expect(r.topProducts[0].productId).toBe('p1');
    expect(r.topProducts[0].unitsSold).toBe(3);
    expect(r.alerts.unattendedOrdersCount).toBe(3);
    expect(r.alerts.lowStockCount).toBe(1);
    expect(prisma.order.findMany).toHaveBeenCalledTimes(2);
    const recentCall = (prisma.order.findMany as jest.Mock).mock.calls[1][0];
    expect(recentCall.where).toEqual(
      expect.objectContaining({
        createdAt: expect.objectContaining({
          gte: expect.any(Date),
          lt: expect.any(Date),
        }),
      }),
    );
  });
});
