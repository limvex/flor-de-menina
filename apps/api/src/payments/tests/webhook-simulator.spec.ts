import { WebhookSimulatorService } from '../webhooks/webhook-simulator.service';

describe('WebhookSimulatorService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('agenda webhook simulado e executa após delay', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const mockPaymentsService = {
      handleWebhook: jest.fn().mockResolvedValue({ ok: true }),
    };
    const mockAdapter = {
      markPaymentStatus: jest.fn(),
    };

    const simulator = new WebhookSimulatorService(
      mockPaymentsService as any,
      mockAdapter as any,
    );

    simulator.simulateWebhook({
      externalId: 'mock_pix_123',
      delayMs: 5000,
      finalStatus: 'approved',
    });

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(5000);

    jest.advanceTimersByTime(5000);

    // flush microtasks
    await Promise.resolve();

    expect(mockAdapter.markPaymentStatus).toHaveBeenCalledWith(
      'mock_pix_123',
      'approved',
    );
    expect(mockPaymentsService.handleWebhook).toHaveBeenCalledTimes(1);
    expect(mockPaymentsService.handleWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        signature: 'MOCK_VALID',
        body: expect.objectContaining({
          data: { id: 'mock_pix_123' },
        }),
      }),
    );
  });

  it('marca status antes de chamar handleWebhook', async () => {
    const order: string[] = [];

    const mockPaymentsService = {
      handleWebhook: jest.fn().mockImplementation(async () => {
        order.push('handleWebhook');
        return { ok: true };
      }),
    };
    const mockAdapter = {
      markPaymentStatus: jest.fn().mockImplementation(() => {
        order.push('markPaymentStatus');
      }),
    };

    const simulator = new WebhookSimulatorService(
      mockPaymentsService as any,
      mockAdapter as any,
    );

    simulator.simulateWebhook({
      externalId: 'mock_pix_456',
      delayMs: 2000,
      finalStatus: 'rejected',
    });

    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(order).toEqual(['markPaymentStatus', 'handleWebhook']);
  });
});
