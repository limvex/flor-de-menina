import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@flor/database';
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
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    },
  };
});

import { prisma } from '@flor/database';

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;
  const stockServiceMock = {
    restoreStockForOrder: jest
      .fn()
      .mockResolvedValue({ movements: 1, skipped: false }),
  };
  const couponsServiceMock = {
    reverseCouponUsage: jest.fn().mockResolvedValue(undefined),
  };
  const emailServiceMock = {
    sendOrderShipped: jest.fn().mockResolvedValue(undefined),
    sendOrderDelivered: jest.fn().mockResolvedValue(undefined),
    sendOrderCancelled: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (cb: (t: typeof prisma) => unknown) => cb(prisma),
    );
    service = new AdminOrdersService(
      stockServiceMock as never,
      couponsServiceMock as never,
      emailServiceMock as never,
    );
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

  const paidOrder = {
    id: 'o1',
    number: 'FDM-1',
    status: OrderStatus.PAID,
    payment: { status: PaymentStatus.APPROVED },
    items: [
      {
        variantId: 'v1',
        quantity: 1,
        productName: 'Vestido',
        variantSize: 'M',
        variantColor: 'Azul',
        productImageUrl: null,
      },
    ],
    shippingAddress: {
      street: 'Rua A',
      number: '1',
      city: 'Maceió',
      state: 'AL',
      postalCode: '57000-000',
    },
    shipping: { serviceName: 'PAC', estimatedDays: 5 },
    user: { name: 'Maria', email: 'maria@test.com' },
    trackingCode: null,
  };

  it('updateStatus PAID → PROCESSING cria histórico e não envia e-mail operacional', async () => {
    (prisma.order.findUnique as jest.Mock)
      .mockResolvedValueOnce({ ...paidOrder, shipping: paidOrder.shipping })
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.PROCESSING,
        updatedAt: new Date(),
        trackingCode: null,
        statusHistory: [
          {
            fromStatus: OrderStatus.PAID,
            toStatus: OrderStatus.PROCESSING,
            notes: null,
            createdAt: new Date(),
          },
        ],
      });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.orderStatusHistory.create as jest.Mock).mockResolvedValue({});

    const r = await service.updateStatus(
      'o1',
      { status: OrderStatus.PROCESSING, notifyCustomer: true },
      'admin-1',
    );

    expect(prisma.orderStatusHistory.create).toHaveBeenCalled();
    expect(r.status).toBe(OrderStatus.PROCESSING);
    expect(emailServiceMock.sendOrderShipped).not.toHaveBeenCalled();
  });

  it('updateStatus SHIPPED sem trackingCode → BadRequest', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...paidOrder,
      status: OrderStatus.PROCESSING,
      payment: { status: PaymentStatus.APPROVED },
    });

    await expect(
      service.updateStatus('o1', { status: OrderStatus.SHIPPED }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateStatus PENDING → SHIPPED transição inválida', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...paidOrder,
      status: OrderStatus.PENDING,
      payment: { status: PaymentStatus.PENDING },
    });

    await expect(
      service.updateStatus(
        'o1',
        { status: OrderStatus.SHIPPED, trackingCode: 'BR1' },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateStatus SHIPPED → CANCELLED bloqueado (reembolso)', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...paidOrder,
      status: OrderStatus.SHIPPED,
      payment: { status: PaymentStatus.APPROVED },
      trackingCode: 'BR1',
    });

    await expect(
      service.updateStatus('o1', { status: OrderStatus.CANCELLED }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateStatus PAID → CANCELLED restaura estoque e reverte cupom', async () => {
    (prisma.order.findUnique as jest.Mock)
      .mockResolvedValueOnce({ ...paidOrder, shipping: paidOrder.shipping })
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.CANCELLED,
        updatedAt: new Date(),
        trackingCode: null,
        statusHistory: [],
      });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.orderStatusHistory.create as jest.Mock).mockResolvedValue({});

    await service.updateStatus(
      'o1',
      { status: OrderStatus.CANCELLED, notifyCustomer: false },
      'admin-1',
    );

    expect(stockServiceMock.restoreStockForOrder).toHaveBeenCalledWith(
      'o1',
      prisma,
    );
    expect(couponsServiceMock.reverseCouponUsage).toHaveBeenCalledWith(
      prisma,
      'o1',
    );
    expect(emailServiceMock.sendOrderCancelled).not.toHaveBeenCalled();
  });

  it('updateStatus SHIPPED com notify chama sendOrderShipped', async () => {
    (prisma.order.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.PROCESSING,
        payment: { status: PaymentStatus.APPROVED },
      })
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.SHIPPED,
        trackingCode: 'BR123',
        updatedAt: new Date(),
        statusHistory: [],
        shipping: paidOrder.shipping,
      });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.orderStatusHistory.create as jest.Mock).mockResolvedValue({});

    await service.updateStatus(
      'o1',
      {
        status: OrderStatus.SHIPPED,
        trackingCode: 'BR123',
        notifyCustomer: true,
      },
      'admin-1',
    );

    expect(emailServiceMock.sendOrderShipped).toHaveBeenCalledTimes(1);
  });

  it('updateStatus com notifyCustomer false não envia e-mail', async () => {
    (prisma.order.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.PROCESSING,
        payment: { status: PaymentStatus.APPROVED },
      })
      .mockResolvedValueOnce({
        ...paidOrder,
        status: OrderStatus.SHIPPED,
        trackingCode: 'BR999',
        updatedAt: new Date(),
        statusHistory: [],
        shipping: paidOrder.shipping,
      });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.orderStatusHistory.create as jest.Mock).mockResolvedValue({});

    await service.updateStatus(
      'o1',
      {
        status: OrderStatus.SHIPPED,
        trackingCode: 'BR999',
        notifyCustomer: false,
      },
      'admin-1',
    );

    expect(emailServiceMock.sendOrderShipped).not.toHaveBeenCalled();
  });
});
