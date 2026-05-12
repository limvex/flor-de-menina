import { NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@flor/database';
import { AdminOrdersService } from '../admin-orders.service';

jest.mock('@flor/database', () => {
  const actual = jest.requireActual('@flor/database');
  return {
    ...actual,
    prisma: {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  };
});

import { prisma } from '@flor/database';

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminOrdersService();
  });

  it('list retorna itens e total', async () => {
    const createdAt = new Date();
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        number: 'FDM-1',
        status: OrderStatus.PAID,
        total: { toNumber: () => 199.9 },
        createdAt,
        user: { name: 'B', email: 'b@c.com' },
      },
    ]);
    (prisma.order.count as jest.Mock).mockResolvedValue(1);

    const r = await service.list({ page: 1, pageSize: 20 });

    expect(r.total).toBe(1);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].number).toBe('FDM-1');
  });

  it('getById lança se não existir', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getById('x')).rejects.toThrow(NotFoundException);
  });
});
