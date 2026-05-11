import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import {
  PaymentGatewayAdapter,
  PixPaymentResult,
  CardPaymentResult,
  PaymentStatusResult,
  InstallmentOption,
} from './payment-gateway.interface';

const MP_INSTALLMENTS_BIN_MASTER = '50314332';

function splitName(full: string): { first: string; last: string } {
  const trimmed = (full || '').trim() || 'Cliente';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: 'Cliente' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function onlyDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

/** CPF válido de teste MP (sandbox) quando o usuário ainda não tem CPF no cadastro. */
const SANDBOX_FALLBACK_CPF = '19119119100';

function mapMpPaymentStatus(
  status: string | undefined,
): PaymentStatusResult['status'] {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'in_process':
    case 'pending':
    default:
      return 'pending';
  }
}

@Injectable()
export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);
  private readonly payment: Payment | null;

  constructor(private config: ConfigService) {
    const accessToken = this.config.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.warn(
        'MercadoPagoAdapter sem MP_ACCESS_TOKEN — create/get de pagamento falharão',
      );
      this.payment = null;
      return;
    }
    const mp = new MercadoPagoConfig({ accessToken });
    this.payment = new Payment(mp);
    this.logger.log('MercadoPagoAdapter inicializado (API de pagamentos)');
  }

  private requirePayment(): Payment {
    if (!this.payment) {
      throw new ServiceUnavailableException(
        'Mercado Pago não configurado (MP_ACCESS_TOKEN ausente)',
      );
    }
    return this.payment;
  }

  private getAccessToken(): string {
    const t = this.config.get<string>('MP_ACCESS_TOKEN');
    if (!t) {
      throw new ServiceUnavailableException('MP_ACCESS_TOKEN ausente');
    }
    return t;
  }

  async createPixPayment(
    input: Parameters<PaymentGatewayAdapter['createPixPayment']>[0],
  ): Promise<PixPaymentResult> {
    const client = this.requirePayment();
    const { first, last } = splitName(input.customerName);
    const cpf = onlyDigits(input.customerCpf);
    const idNumber = cpf.length === 11 ? cpf : SANDBOX_FALLBACK_CPF;

    let res: PaymentResponse;
    const amount = Number(Number(input.amount).toFixed(2));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Valor do pedido inválido para PIX');
    }

    try {
      res = await client.create({
        body: {
          transaction_amount: amount,
          description: input.description.slice(0, 255),
          payment_method_id: 'pix',
          external_reference: input.orderId,
          statement_descriptor: 'FLORDEMENINA',
          payer: {
            entity_type: 'individual',
            email: input.customerEmail,
            first_name: first.slice(0, 60),
            last_name: last.slice(0, 60),
            identification: { type: 'CPF', number: idNumber },
          },
        },
      });
    } catch (e: unknown) {
      this.logMpError('createPixPayment', e);
      if (this.isMercadoPagoPaymentsInternalFailure(e)) {
        throw new BadRequestException(
          this.mercadoPagoPaymentsUnavailableMessage(),
        );
      }
      throw this.toHttpException(
        e,
        'Falha ao criar cobrança PIX no Mercado Pago',
      );
    }

    const id = res.id;
    if (id == null) {
      throw new BadRequestException('Resposta PIX sem id do Mercado Pago');
    }

    const td = res.point_of_interaction?.transaction_data;
    const qrCode = td?.qr_code ?? '';
    const qrCodeBase64 = td?.qr_code_base64 ?? '';
    const copyPaste = qrCode;
    const expiresRaw = res.date_of_expiration;
    const expiresAt = expiresRaw
      ? new Date(expiresRaw)
      : new Date(Date.now() + 30 * 60 * 1000);

    if (res.status === 'rejected' || res.status === 'cancelled') {
      throw new BadRequestException(
        (res.status_detail as string) || 'PIX recusado pelo Mercado Pago',
      );
    }

    if (!qrCode.trim()) {
      const detail =
        (res.status_detail as string) ||
        `PIX sem QR Code (status=${String(res.status)}). Confira no painel do Mercado Pago se a conta de testes tem PIX habilitado.`;
      this.logger.error(`createPixPayment: ${detail} payment_id=${id}`);
      throw new BadRequestException(detail);
    }

    return {
      externalId: String(id),
      qrCode,
      qrCodeBase64,
      copyPaste,
      expiresAt,
      status: 'pending',
    };
  }

  async processCardPayment(
    input: Parameters<PaymentGatewayAdapter['processCardPayment']>[0],
  ): Promise<CardPaymentResult> {
    const client = this.requirePayment();
    const { first, last } = splitName(input.customerName);
    const cpf = onlyDigits(input.customerCpf);
    const idNumber = cpf.length === 11 ? cpf : SANDBOX_FALLBACK_CPF;
    const pmId =
      input.paymentMethodId && input.paymentMethodId !== 'unknown'
        ? input.paymentMethodId
        : 'master';

    const body: Parameters<typeof client.create>[0]['body'] = {
      transaction_amount: Number(Number(input.amount).toFixed(2)),
      token: input.cardToken,
      description: input.description,
      installments: input.installments,
      payment_method_id: pmId,
      external_reference: input.orderId,
      payer: {
        entity_type: 'individual',
        email: input.customerEmail,
        first_name: first.slice(0, 60),
        last_name: last.slice(0, 60),
        identification: { type: 'CPF', number: idNumber },
      },
    };

    if (input.issuerId) {
      const n = Number(input.issuerId);
      if (!Number.isNaN(n)) body.issuer_id = n;
    }

    let res: PaymentResponse;
    try {
      res = await client.create({ body });
    } catch (e: unknown) {
      this.logMpError('processCardPayment', e);
      if (this.isMercadoPagoPaymentsInternalFailure(e)) {
        throw new BadRequestException(
          this.mercadoPagoPaymentsUnavailableMessage(),
        );
      }
      throw this.toHttpException(
        e,
        'Falha ao processar cartão no Mercado Pago',
      );
    }

    const id = res.id;
    if (id == null) {
      throw new BadRequestException(
        'Resposta de cartão sem id do Mercado Pago',
      );
    }

    const externalId = String(id);
    const st = res.status as string | undefined;
    const statusDetail = (res.status_detail as string | undefined) || '';

    if (st === 'approved') {
      return {
        externalId,
        transactionId:
          res.transaction_details?.transaction_id || String(res.id),
        status: 'approved',
        cardLast4: res.card?.last_four_digits || '0000',
        cardBrand: (res.payment_method_id || pmId).toLowerCase(),
        cardHolderName: res.card?.cardholder?.name || input.customerName,
      };
    }

    if (st === 'in_process') {
      return {
        externalId,
        transactionId: res.transaction_details?.transaction_id || '',
        status: 'in_process',
        cardLast4: res.card?.last_four_digits || '0000',
        cardBrand: (res.payment_method_id || pmId).toLowerCase(),
        cardHolderName: res.card?.cardholder?.name || input.customerName,
      };
    }

    return {
      externalId,
      transactionId: '',
      status: 'rejected',
      cardLast4: res.card?.last_four_digits || '0000',
      cardBrand: (res.payment_method_id || pmId).toLowerCase(),
      cardHolderName: res.card?.cardholder?.name || input.customerName,
      failureReason: statusDetail || st || 'cc_rejected_other_reason',
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    const client = this.requirePayment();
    const id = Number(externalId);
    if (Number.isNaN(id)) {
      return { externalId, status: 'pending' };
    }

    let res: PaymentResponse;
    try {
      res = await client.get({ id });
    } catch (e: unknown) {
      this.logMpError('getPaymentStatus', e);
      return { externalId, status: 'pending' };
    }

    const mapped = mapMpPaymentStatus(res.status);
    const paidAt =
      mapped === 'approved' && res.date_approved
        ? new Date(res.date_approved)
        : undefined;

    return {
      externalId,
      status: mapped,
      paidAt,
      transactionId: res.transaction_details?.transaction_id,
      failureReason:
        mapped === 'rejected'
          ? (res.status_detail as string | undefined) || undefined
          : undefined,
    };
  }

  validateWebhookSignature(input: {
    rawBody: string;
    signature: string;
    requestId: string;
  }): boolean {
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET')?.trim();
    const allowInsecure =
      this.config.get<string>('ALLOW_WEBHOOK_WITHOUT_SECRET') === 'true';

    if (!secret) {
      if (allowInsecure) {
        this.logger.warn(
          'validateWebhookSignature: MP_WEBHOOK_SECRET vazio — ALLOW_WEBHOOK_WITHOUT_SECRET=true (somente dev); aceitando webhook sem validar assinatura.',
        );
        void input;
        return true;
      }
      this.logger.warn(
        'validateWebhookSignature: MP_WEBHOOK_SECRET vazio — configure o segredo do painel MP ou defina ALLOW_WEBHOOK_WITHOUT_SECRET=true em dev local.',
      );
      return false;
    }
    void input;
    void secret;
    this.logger.warn(
      'validateWebhookSignature: validação HMAC completa ainda não implementada',
    );
    return false;
  }

  async getInstallmentOptions(amount: number): Promise<InstallmentOption[]> {
    const token = this.getAccessToken();
    const url = new URL(
      'https://api.mercadopago.com/v1/payment_methods/installments',
    );
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('payment_method_id', 'master');
    url.searchParams.set('bin', MP_INSTALLMENTS_BIN_MASTER);

    let data: unknown;
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.warn(
          `installments HTTP ${res.status} — retornando 1x sem juros`,
        );
        return this.fallbackInstallments(amount);
      }
      data = await res.json();
    } catch (e) {
      this.logger.warn(e, 'installments fetch falhou — retornando 1x');
      return this.fallbackInstallments(amount);
    }

    const parsed = this.parseInstallmentsResponse(data, amount);
    if (parsed.length) return parsed;
    return this.fallbackInstallments(amount);
  }

  private fallbackInstallments(amount: number): InstallmentOption[] {
    const total = Number(amount.toFixed(2));
    const out: InstallmentOption[] = [];
    for (let n = 1; n <= 5; n++) {
      out.push({
        installments: n,
        installmentAmount: Number((total / n).toFixed(2)),
        totalAmount: total,
        hasInterest: false,
      });
    }
    return out;
  }

  private parseInstallmentsResponse(
    data: unknown,
    _amount: number,
  ): InstallmentOption[] {
    if (!Array.isArray(data) || !data[0]) return [];
    const first = data[0] as { payer_costs?: unknown[] };
    const costs = first.payer_costs;
    if (!Array.isArray(costs)) return [];

    const out: InstallmentOption[] = [];
    for (const c of costs) {
      if (!c || typeof c !== 'object') continue;
      const row = c as Record<string, unknown>;
      const installments = Number(row.installments);
      if (!Number.isFinite(installments) || installments < 1) continue;
      const installmentAmount = Number(row.installment_amount);
      const totalAmount = Number(
        row.total_amount ?? installments * installmentAmount,
      );
      const labels = row.labels as Record<string, unknown> | undefined;
      const hasInterest = Boolean(labels?.interest_free_installments === false);
      out.push({
        installments,
        installmentAmount: Number(installmentAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        hasInterest,
      });
    }
    if (!out.length) return [];
    const capped = out.filter((o) => o.installments <= 5);
    if (!capped.length) return this.fallbackInstallments(_amount);
    return capped.sort((a, b) => a.installments - b.installments);
  }

  private logMpError(context: string, e: unknown): void {
    if (e instanceof Error) {
      this.logger.error(`${context}: ${e.message}`, e.stack);
      return;
    }
    if (e && typeof e === 'object') {
      this.logger.error(`${context}: ${JSON.stringify(e)}`);
      return;
    }
    this.logger.error(`${context}: ${String(e)}`);
  }

  private toHttpException(e: unknown, fallback: string): BadRequestException {
    if (e instanceof BadRequestException) return e;
    const extracted = this.extractMercadoPagoMessage(e);
    return new BadRequestException(extracted || fallback);
  }

  /** O SDK lança o JSON do MP (não `Error`) quando a API REST falha. */
  private extractMercadoPagoMessage(e: unknown): string | null {
    if (!e || typeof e !== 'object') return null;
    const any = e as Record<string, unknown>;
    const cause = any.cause;
    if (Array.isArray(cause) && cause.length > 0) {
      const parts = cause
        .map((c) => {
          if (!c || typeof c !== 'object') return null;
          const o = c as Record<string, unknown>;
          const code = o.code != null ? String(o.code) : '';
          const desc = o.description != null ? String(o.description) : '';
          const msg = o.message != null ? String(o.message) : '';
          return [code, desc, msg].filter(Boolean).join(' — ');
        })
        .filter((x): x is string => Boolean(x));
      if (parts.length) return parts.join(' | ');
    }
    if (cause && typeof cause === 'object' && !Array.isArray(cause)) {
      const o = cause as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
    }
    if (typeof any.error === 'string' && any.error.trim()) {
      return any.error;
    }
    if (typeof any.message === 'string') return any.message;
    return null;
  }

  /** Resposta genérica do MP quando a conta/app não consegue criar cobrança via API de Pagamentos. */
  private isMercadoPagoPaymentsInternalFailure(e: unknown): boolean {
    if (!e || typeof e !== 'object') return false;
    const o = e as Record<string, unknown>;
    const msg = typeof o.message === 'string' ? o.message : '';
    const st = Number(o.status);
    return msg === 'internal_error' || st === 500;
  }

  private mercadoPagoPaymentsUnavailableMessage(): string {
    return (
      'Mercado Pago retornou erro interno ao criar o pagamento (API /v1/payments). ' +
      'O token está válido, mas esta aplicação/conta costuma precisar: (1) Public Key e Access Token de teste da mesma aplicação em Suas integrações; ' +
      '(2) conta de vendedor apta a receber via API de Pagamentos (Preferências pode funcionar mesmo com Pagamentos bloqueado); ' +
      '(3) concluir cadastro/dados fiscais no painel. Gere um novo par de credenciais de teste ou abra um chamado no suporte MP. ' +
      'Para desenvolver o fluxo enquanto isso, use PAYMENT_PROVIDER=mock na API.'
    );
  }
}
