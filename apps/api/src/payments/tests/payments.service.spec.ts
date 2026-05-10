import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { MockPaymentAdapter } from '../adapters/mock-payment.adapter';
import { MercadoPagoAdapter } from '../adapters/mercado-pago.adapter';
import {
  PaymentStatus,
  OrderStatus,
  PaymentProvider,
  PaymentMethod,
} from '@flor/database';

// Mock do @flor/database para evitar conexão real com o banco
jest.mock('@flor/database', () => {
  const original = jest.requireActual('@flor/database');
  return {
    ...original,
    prisma: {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      paymentEvent: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

// Import after mock setup
import { prisma } from '@flor/database';

const mockOrder = {
  id: 'order_1',
  number: 'FM-001',
  status: OrderStatus.PENDING,
  total: 275.9,
  user: { id: 'user_1', email: 'a@b.com', name: 'Ana', cpf: '12345678900' },
  payment: null,
};

const mockPayment = {
  id: 'pay_1',
  orderId: 'order_1',
  method: PaymentMethod.PIX,
  status: PaymentStatus.PENDING,
  provider: PaymentProvider.MOCK,
  amount: 275.9,
  installments: 1,
  externalId: 'mock_pix_xyz',
  pixQrCode: 'qr',
  pixQrCodeBase64: 'base64',
  pixCopyPaste: 'copy',
  pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  cardLast4: null,
  cardBrand: null,
  cardHolderName: null,
  transactionId: null,
  paidAt: null,
  failureReason: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: { id: 'order_1', number: 'FM-001', status: OrderStatus.PENDING },
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockAdapter: MockPaymentAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAdapter = new MockPaymentAdapter();

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
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('processPayment — PIX', () => {
    it('cria Payment com status PENDING e retorna dados PIX', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.payment.upsert as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      const result = await service.processPayment({
        orderId: 'order_1',
        method: 'PIX',
      });

      expect(result.method).toBe('PIX');
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect('pix' in result).toBe(true);
      if ('pix' in result) {
        expect(result.pix?.qrCodeBase64).toBeTruthy();
      }
    }, 10000);
  });

  describe('processPayment — cartão', () => {
    it('sem cardToken lança BadRequest', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        service.processPayment({ orderId: 'order_1', method: 'CREDIT_CARD' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('order não encontrada lança NotFoundException', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.processPayment({ orderId: 'order_x', method: 'PIX' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('order já paga lança BadRequest', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        payment: { status: PaymentStatus.APPROVED },
      });

      await expect(
        service.processPayment({ orderId: 'order_1', method: 'PIX' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('order com status PAID lança BadRequest', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        payment: null,
      });

      await expect(
        service.processPayment({ orderId: 'order_1', method: 'PIX' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaymentStatus', () => {
    it('payment não encontrado lança NotFoundException', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getPaymentStatus('pay_x')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('payment aprovado retorna sem chamar adapter', async () => {
      const getStatusSpy = jest.spyOn(mockAdapter, 'getPaymentStatus');
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.APPROVED,
        paidAt: new Date(),
      });

      const result = await service.getPaymentStatus('pay_1');

      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(getStatusSpy).not.toHaveBeenCalled();
    });
  });

  describe('getInstallmentOptions', () => {
    it('amount negativo lança BadRequest', async () => {
      await expect(service.getInstallmentOptions(-1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('amount zero lança BadRequest', async () => {
      await expect(service.getInstallmentOptions(0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('retorna opções para amount válido', async () => {
      const result = await service.getInstallmentOptions(500);
      expect(result.length).toBeGreaterThan(0);
    }, 5000);
  });
});
