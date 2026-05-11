import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments.service';
import { MockPaymentAdapter } from '../adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from '../adapters/mercado-pago.adapter';
import {
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from '@flor/database';
import { StockService } from '../../modules/stock/stock.service';
import { CartService } from '../../modules/cart/cart.service';
import { EmailService } from '../../email/email.service';

jest.mock('@flor/database', () => {
  const original = jest.requireActual('@flor/database');
  const prismaMock = {
    order: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    paymentEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    ...original,
    prisma: {
      ...prismaMock,
      $transaction: (cb: any) => cb(prismaMock),
    },
  };
});

import { prisma } from '@flor/database';

describe('handleWebhook — finalização do pedido', () => {
  const basePayment = {
    id: 'pay_1',
    orderId: 'order_1',
    externalId: 'mock_pix_xyz',
    status: PaymentStatus.PENDING,
    method: PaymentMethod.PIX,
    provider: PaymentProvider.MOCK,
    amount: 275.9,
    installments: 1,
    transactionId: null,
    paidAt: null,
    failureReason: null,
    metadata: null,
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixCopyPaste: null,
    pixExpiresAt: null,
    cardLast4: null,
    cardBrand: null,
    cardHolderName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: {
      id: 'order_1',
      userId: 'user_1',
      number: 'FM-001',
      status: OrderStatus.PENDING,
      total: 275.9,
    },
  };

  const baseFullOrder = {
    id: 'order_1',
    number: 'FM-001',
    status: 'PENDING',
    shippingAddress: {},
    subtotal: 100,
    shippingCost: 50,
    discount: 0,
    total: 275.9,
    user: {
      name: 'Ana',
      email: 'ana@teste.com',
    },
    payment: {
      failureReason: null,
      method: 'PIX',
      amount: 275.9,
    },
    items: [
      {
        id: 'oi_1',
        productName: 'Vestido',
        variantSize: 'M',
        variantColor: 'Azul',
        quantity: 1,
        unitPrice: 125.0,
      },
    ],
  };

  async function makeModule(adapter: Partial<MockPaymentAdapter>) {
    const stockServiceMock = {
      decrementStockForOrder: jest.fn().mockResolvedValue({
        movements: 1,
        skipped: false,
      }),
      restoreStockForOrder: jest.fn().mockResolvedValue({
        movements: 1,
        skipped: false,
      }),
    };

    const cartServiceMock = {
      clearCart: jest.fn().mockResolvedValue(undefined),
    };

    const emailServiceMock = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
      sendPaymentFailure: jest.fn().mockResolvedValue(undefined),
      sendRefund: jest.fn().mockResolvedValue(undefined),
    };

    const m = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def: any) =>
              key === 'PAYMENT_PROVIDER' ? 'mock' : def,
          },
        },
        { provide: MockPaymentAdapter, useValue: adapter },
        {
          provide: MercadoPagoAdapter,
          useValue: {},
        },
        { provide: StockService, useValue: stockServiceMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    return { module: m, stockServiceMock, cartServiceMock, emailServiceMock };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(basePayment);
    (prisma.paymentEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.paymentEvent.upsert as jest.Mock).mockResolvedValue({
      id: 'evt_1',
    });
    (prisma.payment.update as jest.Mock).mockResolvedValue({
      ...basePayment,
    });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(baseFullOrder);
    (prisma.paymentEvent.update as jest.Mock).mockResolvedValue({});
  });

  it('webhook APPROVED decrementa estoque + envia e-mail de confirmação', async () => {
    const adapter = {
      validateWebhookSignature: jest.fn(() => true),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'approved',
        transactionId: 'mock_tx_1',
      }),
    } as any;

    const { module, stockServiceMock, cartServiceMock, emailServiceMock } =
      await makeModule(adapter);

    const service = module.get(PaymentsService);

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r1',
      body: { id: 'evt_ok_1', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toMatchObject({
      ok: true,
      newStatus: PaymentStatus.APPROVED,
    });

    expect(stockServiceMock.decrementStockForOrder).toHaveBeenCalledTimes(1);
    expect(stockServiceMock.decrementStockForOrder).toHaveBeenCalledWith(
      'order_1',
      expect.any(Object),
    );

    expect(cartServiceMock.clearCart).toHaveBeenCalledTimes(1);
    expect(cartServiceMock.clearCart).toHaveBeenCalledWith(
      'user_1',
      expect.any(Object),
    );

    expect(emailServiceMock.sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendOrderConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order_1',
        orderNumber: 'FM-001',
        customerEmail: 'ana@teste.com',
      }),
    );
  });

  it('webhook REJECTED restaura estoque + envia e-mail de falha', async () => {
    const adapter = {
      validateWebhookSignature: jest.fn(() => true),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'rejected',
        failureReason: 'cc_rejected_other_reason',
      }),
    } as any;

    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...baseFullOrder,
      payment: {
        ...baseFullOrder.payment,
        failureReason: 'cc_rejected_other_reason',
      },
    });

    const { module, stockServiceMock, cartServiceMock, emailServiceMock } =
      await makeModule(adapter);

    const service = module.get(PaymentsService);

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r2',
      body: { id: 'evt_rej_1', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toMatchObject({
      ok: true,
      newStatus: PaymentStatus.REJECTED,
    });

    expect(stockServiceMock.restoreStockForOrder).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendPaymentFailure).toHaveBeenCalledTimes(1);

    expect(emailServiceMock.sendPaymentFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'cc_rejected_other_reason',
      }),
    );

    expect(cartServiceMock.clearCart).toHaveBeenCalledTimes(1);
  });

  it('webhook REFUNDED restaura estoque + envia e-mail de reembolso', async () => {
    const adapter = {
      validateWebhookSignature: jest.fn(() => true),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'refunded',
      }),
    } as any;

    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...baseFullOrder,
      payment: {
        ...baseFullOrder.payment,
        amount: 275.9,
      },
    });

    const { module, stockServiceMock, emailServiceMock } =
      await makeModule(adapter);
    const service = module.get(PaymentsService);

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r3',
      body: { id: 'evt_ref_1', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toMatchObject({
      ok: true,
      newStatus: PaymentStatus.REFUNDED,
    });

    expect(stockServiceMock.restoreStockForOrder).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendRefund).toHaveBeenCalledTimes(1);
  });

  it('evento duplicado não roda side effects 2x', async () => {
    const adapter = {
      validateWebhookSignature: jest.fn(() => true),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'approved',
      }),
    } as any;

    // 1ª chamada: evento não processado
    (prisma.paymentEvent.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'evt_1',
        processed: true,
        externalEventId: 'evt_dup',
      });

    const { module, stockServiceMock, emailServiceMock } =
      await makeModule(adapter);
    const service = module.get(PaymentsService);

    await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r4',
      body: { id: 'evt_dup', data: { id: 'mock_pix_xyz' } },
    });

    await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r4',
      body: { id: 'evt_dup', data: { id: 'mock_pix_xyz' } },
    });

    expect(stockServiceMock.decrementStockForOrder).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('erro em decrementStockForOrder aborta (não marca processed / não envia e-mail)', async () => {
    const adapter = {
      validateWebhookSignature: jest.fn(() => true),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'approved',
      }),
    } as any;

    const stockServiceThrow = {
      decrementStockForOrder: jest
        .fn()
        .mockRejectedValue(new Error('stock failure')),
      restoreStockForOrder: jest.fn(),
    };

    const cartServiceMock = { clearCart: jest.fn() };
    const emailServiceMock = {
      sendOrderConfirmation: jest.fn(),
      sendPaymentFailure: jest.fn(),
      sendRefund: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def: any) =>
              key === 'PAYMENT_PROVIDER' ? 'mock' : def,
          },
        },
        { provide: MockPaymentAdapter, useValue: adapter },
        { provide: MercadoPagoAdapter, useValue: {} },
        { provide: StockService, useValue: stockServiceThrow },
        { provide: CartService, useValue: cartServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    const service = module.get(PaymentsService);

    await expect(
      service.handleWebhook({
        rawBody: '{}',
        signature: 'MOCK_VALID',
        requestId: 'r5',
        body: { id: 'evt_err_1', data: { id: 'mock_pix_xyz' } },
      }),
    ).rejects.toThrow('stock failure');

    expect(emailServiceMock.sendOrderConfirmation).not.toHaveBeenCalled();
    expect(prisma.paymentEvent.update).not.toHaveBeenCalled();
  });
});
