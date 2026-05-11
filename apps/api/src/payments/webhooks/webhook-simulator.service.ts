import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { MockPaymentAdapter } from '../adapters/mock-payment.adapter';

export type MockFinalStatus = 'approved' | 'rejected';

@Injectable()
export class WebhookSimulatorService {
  private readonly logger = new Logger(WebhookSimulatorService.name);

  constructor(
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => MockPaymentAdapter))
    private mockAdapter: MockPaymentAdapter,
  ) {}

  /**
   * Simula webhook do Mercado Pago apenas para o modo mock.
   * Não persiste: usa `setTimeout` e chama o próprio handler interno.
   */
  async simulateWebhook(input: {
    externalId: string;
    delayMs: number;
    finalStatus: MockFinalStatus;
  }) {
    const { externalId, delayMs, finalStatus } = input;

    const eventId = `mock_evt_${Date.now()}_${externalId}`;
    const requestId = `mock_req_${Date.now()}_${externalId}`;

    this.logger.log(
      `[MOCK] Agendando webhook: externalId=${externalId} em ${delayMs}ms finalStatus=${finalStatus}`,
    );

    setTimeout(async () => {
      try {
        this.mockAdapter.markPaymentStatus(externalId, finalStatus);

        await this.paymentsService.handleWebhook({
          rawBody: JSON.stringify({
            action: 'payment.updated',
            id: eventId,
            data: { id: externalId },
          }),
          signature: 'MOCK_VALID',
          requestId,
          body: {
            action: 'payment.updated',
            id: eventId,
            data: { id: externalId },
          },
        });

        this.logger.log(
          `[MOCK] Webhook simulado processado: externalId=${externalId} finalStatus=${finalStatus}`,
        );
      } catch (error: any) {
        const message =
          error instanceof Error ? error.message : String(error ?? 'unknown');
        this.logger.error(
          `[MOCK] Erro ao simular webhook: externalId=${externalId} msg=${message}`,
        );
      }
    }, delayMs);
  }
}
