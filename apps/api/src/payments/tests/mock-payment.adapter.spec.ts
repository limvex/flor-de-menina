import { MockPaymentAdapter } from '../adapters/mock-payment.adapter';

describe('MockPaymentAdapter', () => {
  let adapter: MockPaymentAdapter;
  const configMock = {
    get: jest.fn((key: string, def: unknown) => def),
  } as any;
  const webhookSimulatorMock = {
    simulateWebhook: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MockPaymentAdapter(configMock, webhookSimulatorMock);
  });

  describe('createPixPayment', () => {
    it('retorna QR code, copyPaste e expiresAt', async () => {
      const result = await adapter.createPixPayment({
        orderId: 'order_123',
        amount: 250.0,
        customerEmail: 'a@b.com',
        customerName: 'Teste',
        customerCpf: '12345678900',
        description: 'Pedido teste',
      });

      expect(result.externalId).toMatch(/^mock_pix_/);
      expect(result.qrCode).toBeTruthy();
      expect(result.qrCodeBase64).toBeTruthy();
      expect(result.copyPaste).toBeTruthy();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(result.status).toBe('pending');
    }, 10000);
  });

  describe('processCardPayment', () => {
    it('retorna campos obrigatórios em qualquer resultado', async () => {
      const result = await adapter.processCardPayment({
        orderId: 'order_123',
        amount: 100,
        installments: 1,
        cardToken: 'MOCK_TOKEN_VISA_4242',
        paymentMethodId: 'visa',
        customerEmail: 'a@b.com',
        customerName: 'Teste',
        customerCpf: '12345678900',
        description: 'teste',
      });

      expect(result.externalId).toMatch(/^mock_card_/);
      expect(['approved', 'rejected']).toContain(result.status);
      expect(result.cardLast4).toBe('4242');
      expect(result.cardBrand).toBe('visa');
    }, 10000);

    it('extrai brand e last4 do mock token', async () => {
      const result = await adapter.processCardPayment({
        orderId: 'o',
        amount: 100,
        installments: 1,
        cardToken: 'MOCK_TOKEN_MASTER_5500',
        paymentMethodId: 'master',
        customerEmail: 'a@b.com',
        customerName: 'João Silva',
        customerCpf: '11111111111',
        description: 'd',
      });

      expect(result.cardBrand).toBe('master');
      expect(result.cardLast4).toBe('5500');
      expect(result.cardHolderName).toBe('João Silva');
    }, 10000);

    it('mock_tok_visa_0001 rejeita sempre com failureReason', async () => {
      const result = await adapter.processCardPayment({
        orderId: 'o',
        amount: 100,
        installments: 1,
        cardToken: 'mock_tok_visa_0001',
        paymentMethodId: 'visa',
        customerEmail: 'a@b.com',
        customerName: 'T',
        customerCpf: '1',
        description: 'd',
      });

      expect(result.status).toBe('rejected');
      expect(result.failureReason).toBe('cc_rejected_insufficient_amount');
    }, 10000);

    it('rejeição retorna failureReason com prefixo cc_rejected_', async () => {
      const results = await Promise.all(
        Array.from({ length: 30 }, () =>
          adapter.processCardPayment({
            orderId: 'o',
            amount: 100,
            installments: 1,
            cardToken: 'MOCK_TOKEN_VISA_4111',
            paymentMethodId: 'visa',
            customerEmail: 'a@b.com',
            customerName: 'T',
            customerCpf: '1',
            description: 'd',
          }),
        ),
      );

      const rejected = results.find((r) => r.status === 'rejected');
      if (rejected) {
        expect(rejected.failureReason).toBeTruthy();
        expect(rejected.failureReason).toMatch(/cc_rejected_/);
      }
    }, 60000);
  });

  describe('getInstallmentOptions', () => {
    it('retorna até 5x sem juros', async () => {
      const result = await adapter.getInstallmentOptions(1000);
      expect(result).toHaveLength(5);
      expect(result.every((r) => !r.hasInterest)).toBe(true);
    }, 5000);

    it('1x até 5x sem juros', async () => {
      const result = await adapter.getInstallmentOptions(300);
      for (let i = 0; i < 5; i++) {
        expect(result[i].hasInterest).toBe(false);
        expect(result[i].installments).toBe(i + 1);
      }
    }, 5000);

    it('totalAmount é coerente com installmentAmount', async () => {
      const options = await adapter.getInstallmentOptions(1000);
      for (const opt of options) {
        const sum = Number(
          (opt.installmentAmount * opt.installments).toFixed(2),
        );
        expect(Math.abs(sum - opt.totalAmount)).toBeLessThan(
          opt.installments * 0.01,
        );
      }
    }, 5000);
  });

  describe('validateWebhookSignature', () => {
    it('aceita MOCK_VALID', () => {
      expect(
        adapter.validateWebhookSignature({
          rawBody: '{}',
          signature: 'MOCK_VALID',
          requestId: 'r1',
        }),
      ).toBe(true);
    });

    it('aceita assinatura iniciada com mock_', () => {
      expect(
        adapter.validateWebhookSignature({
          rawBody: '{}',
          signature: 'mock_xyz',
          requestId: 'r',
        }),
      ).toBe(true);
    });

    it('rejeita outras assinaturas', () => {
      expect(
        adapter.validateWebhookSignature({
          rawBody: '{}',
          signature: 'real_signature',
          requestId: 'r',
        }),
      ).toBe(false);
    });
  });

  describe('getPaymentStatus', () => {
    it('getPaymentStatus é determinístico após markPaymentStatus', async () => {
      adapter.markPaymentStatus('mock_pix_abc123', 'approved');
      const result = await adapter.getPaymentStatus('mock_pix_abc123');
      expect(result.status).toBe('approved');
    }, 5000);
  });
});
