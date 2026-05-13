import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { MockPaymentAdapter } from '../adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from '../adapters/mercado-pago.adapter';
import { PaymentStatus, PaymentProvider, PaymentMethod } from '@flor/database';
import { StockService } from '../../modules/stock/stock.service';
import { CartService } from '../../modules/cart/cart.service';
import { EmailService } from '../../email/email.service';
import { CouponsService } from '../../modules/coupons/coupons.service';

// Mock do prisma — reutiliza o mock definido no payments.service.spec
jest.mock('@flor/database', () => {
  const original = jest.requireActual('@flor/database');
  const prismaMock = {
    order: { update: jest.fn(), findUnique: jest.fn() },
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

describe('handleWebhook — idempotência', () => {
  let service: PaymentsService;
  let emailService: EmailService;

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
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixCopyPaste: null,
    pixExpiresAt: null,
    cardLast4: null,
    cardBrand: null,
    cardHolderName: null,
    failureReason: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockAdapter = {
      validateWebhookSignature: jest.fn(
        ({ signature }: { signature: string }) => signature === 'MOCK_VALID',
      ),
      getPaymentStatus: jest.fn().mockResolvedValue({
        externalId: 'mock_pix_xyz',
        status: 'pending',
        transactionId: undefined,
      }),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def: string) =>
              key === 'PAYMENT_PROVIDER' ? 'mock' : def,
          },
        },
        { provide: MockPaymentAdapter, useValue: mockAdapter },
        {
          provide: MercadoPagoAdapter,
          useValue: {
            createPixPayment: jest.fn(),
            processCardPayment: jest.fn(),
            getPaymentStatus: jest.fn(),
            validateWebhookSignature: jest.fn(),
            getInstallmentOptions: jest.fn(),
          },
        },
        { provide: StockService, useValue: {} },
        { provide: CartService, useValue: { clearCart: jest.fn() } },
        {
          provide: EmailService,
          useValue: {
            sendOrderConfirmation: jest.fn(),
            sendPaymentFailure: jest.fn(),
            sendRefund: jest.fn(),
          },
        },
        {
          provide: CouponsService,
          useValue: {
            reverseCouponUsage: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
    emailService = module.get(EmailService);
  });

  it('webhook com signature inválida lança UnauthorizedException (401)', async () => {
    await expect(
      service.handleWebhook({
        rawBody: '{}',
        signature: 'invalid_real_signature',
        requestId: 'r1',
        body: { data: { id: 'mock_pix_xyz' } },
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('evento já processado retorna skipped:already_processed', async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(basePayment);
    (prisma.paymentEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'evt_1',
      processed: true,
      externalEventId: 'evt_001',
    });

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r1',
      body: { id: 'evt_001', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: 'already_processed',
    });
    expect(prisma.paymentEvent.upsert).not.toHaveBeenCalled();
    expect(emailService.sendOrderConfirmation).not.toHaveBeenCalled();
    expect(emailService.sendPaymentFailure).not.toHaveBeenCalled();
    expect(emailService.sendRefund).not.toHaveBeenCalled();
  });

  it('payment não encontrado retorna skipped:payment_not_found', async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r2',
      body: { id: 'evt_002', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: 'payment_not_found',
    });
  });

  it('webhook sem data.id retorna skipped:no_data_id', async () => {
    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r3',
      body: { id: 'evt_003' },
    });

    expect(result).toMatchObject({ skipped: true, reason: 'no_data_id' });
  });

  it('primeira chamada processa e marca evento como processed', async () => {
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(basePayment);
    (prisma.paymentEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.paymentEvent.upsert as jest.Mock).mockResolvedValue({
      id: 'evt_new',
    });
    (prisma.payment.update as jest.Mock).mockResolvedValue({
      ...basePayment,
      status: PaymentStatus.APPROVED,
    });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    (prisma.paymentEvent.update as jest.Mock).mockResolvedValue({});

    const result = await service.handleWebhook({
      rawBody: '{}',
      signature: 'MOCK_VALID',
      requestId: 'r4',
      body: { id: 'evt_004', data: { id: 'mock_pix_xyz' } },
    });

    expect(result).toHaveProperty('ok', true);
    expect(prisma.paymentEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processed: true }),
      }),
    );
  }, 10000);
});
