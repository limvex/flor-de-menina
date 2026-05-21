import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { MailService } from '../mail/mail.service';
import type {
  OrderCancelledEmailPayload,
  OrderConfirmationEmailPayload,
  OrderDeliveredEmailPayload,
  OrderShippedEmailPayload,
  PaymentFailureEmailPayload,
  RefundEmailPayload,
} from './interfaces/email-payload.interface';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private smtpTransporter: Transporter | null = null;

  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private useDirectMaildevSmtp(): boolean {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const provider = this.config.get<string>('MAIL_PROVIDER', 'maildev');
    return nodeEnv !== 'production' || provider === 'maildev';
  }

  private getSmtpTransporter(): Transporter {
    if (!this.smtpTransporter) {
      const host = this.config.get<string>('SMTP_HOST', 'localhost');
      const port = Number(this.config.get<string>('SMTP_PORT', '1025'));
      this.smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
      });
    }
    return this.smtpTransporter;
  }

  private mailFromHeader(): string {
    const name = this.config.get<string>('MAIL_FROM_NAME', 'Flor de Menina');
    const email = this.config.get<string>(
      'MAIL_FROM_EMAIL',
      'contato@flordemenina.store',
    );
    return `${name} <${email}>`;
  }

  private optionalUrl(key: string): string | undefined {
    const v = this.config.get<string>(key, '')?.trim();
    return v || undefined;
  }

  private renderEmailLayout(input: {
    title: string;
    content: string;
    cta?: { text: string; url: string };
    whatsappUrl?: string;
    instagramUrl?: string;
  }): string {
    const wa = input.whatsappUrl?.trim();
    const ig = input.instagramUrl?.trim();
    const ctaBlock = input.cta
      ? `
          <tr>
            <td align="center" style="padding:0 32px 32px 32px;">
              <a href="${escHtml(input.cta.url)}"
                 style="display:inline-block;background-color:#3d2817;color:#ffffff;padding:14px 36px;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
                ${escHtml(input.cta.text)}
              </a>
            </td>
          </tr>`
      : '';

    const waBlock = wa
      ? `
              <a href="${escHtml(wa)}" style="display:inline-block;margin:0 8px;color:#3d2817;text-decoration:none;font-size:13px;">
                WhatsApp
              </a>`
      : '';
    const igBlock = ig
      ? `
              <a href="${escHtml(ig)}" style="display:inline-block;margin:0 8px;color:#3d2817;text-decoration:none;font-size:13px;">
                Instagram
              </a>`
      : '';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0ea;font-family:Georgia,'Times New Roman',serif;color:#3d2817;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f0ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border:1px solid #e5dcd0;box-shadow:0 2px 8px rgba(61,40,23,0.06);">

          <tr>
            <td align="center" style="padding:32px 24px 16px 24px;border-bottom:1px solid #e5dcd0;">
              <h1 style="margin:0;font-size:24px;letter-spacing:6px;font-weight:400;color:#3d2817;text-transform:uppercase;">
                Flor de Menina
              </h1>
              <p style="margin:8px 0 0 0;font-size:12px;letter-spacing:2px;color:#a87c4f;text-transform:uppercase;">
                Moda Feminina
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <h2 style="margin:0;font-size:22px;font-weight:400;color:#3d2817;text-align:center;">
                ${escHtml(input.title)}
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px 32px;font-size:15px;line-height:1.6;color:#5c4a36;font-family:Georgia,'Times New Roman',serif;">
              ${input.content}
            </td>
          </tr>

          ${ctaBlock}

          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5dcd0;background-color:#fafaf7;text-align:center;">
              <p style="margin:0 0 12px 0;font-size:13px;color:#a87c4f;">
                Dúvidas? Fale com a gente
              </p>
              ${waBlock}
              ${igBlock}
              <p style="margin:16px 0 0 0;font-size:11px;color:#a87c4f;letter-spacing:1px;">
                FLOR DE MENINA · MACEIÓ/AL
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  }

  private async sendViaMaildev(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const transporter = this.getSmtpTransporter();
    await transporter.sendMail({
      from: this.mailFromHeader(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }

  async sendOrderConfirmation(payload: OrderConfirmationEmailPayload) {
    this.logger.log(
      `[EMAIL] order_confirmation order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    await this.mailService.sendPaymentApproved(payload.orderId);
  }

  async sendPaymentApproved(orderId: string): Promise<void> {
    await this.mailService.sendPaymentApproved(orderId);
  }

  async sendPaymentFailure(payload: PaymentFailureEmailPayload) {
    this.logger.log(
      `[EMAIL] payment_failure order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    await this.mailService.sendPaymentRejected(payload.orderId, payload.reason);
  }

  async sendRefund(payload: RefundEmailPayload) {
    this.logger.log(
      `[EMAIL] refund order=${payload.orderNumber} to=${payload.customerEmail} amount=${payload.amount}`,
    );
    // Reembolso: notifica com email de pagamento rejeitado adaptado
    await this.mailService.sendPaymentRejected(
      payload.orderId,
      `Reembolso de R$ ${payload.amount.toFixed(2)} processado.`,
    );
  }

  async sendOrderShipped(payload: OrderShippedEmailPayload): Promise<void> {
    this.logger.log(
      `[EMAIL] order_shipped order=${payload.orderNumber} to=${payload.customerEmail} tracking=${payload.trackingCode}`,
    );
    if (this.useDirectMaildevSmtp()) {
      await this.sendViaMaildev({
        to: payload.customerEmail,
        subject: `Pedido ${payload.orderNumber} enviado`,
        html: this.renderShippedTemplate(payload),
      });
      return;
    }
    await this.mailService.sendOrderShipped(
      payload.orderId,
      payload.trackingCode,
      payload.estimatedDays ?? undefined,
    );
  }

  async sendOrderDelivered(payload: OrderDeliveredEmailPayload): Promise<void> {
    this.logger.log(
      `[EMAIL] order_delivered order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    if (this.useDirectMaildevSmtp()) {
      await this.sendViaMaildev({
        to: payload.customerEmail,
        subject: `Pedido ${payload.orderNumber} entregue`,
        html: this.renderDeliveredTemplate(payload),
      });
      return;
    }
    await this.mailService.sendOrderDelivered(payload.orderId);
  }

  async sendOrderCancelled(payload: OrderCancelledEmailPayload): Promise<void> {
    this.logger.log(
      `[EMAIL] order_cancelled order=${payload.orderNumber} to=${payload.customerEmail}`,
    );
    if (this.useDirectMaildevSmtp()) {
      await this.sendViaMaildev({
        to: payload.customerEmail,
        subject: `Pedido ${payload.orderNumber} cancelado`,
        html: this.renderCancelledTemplate(payload),
      });
      return;
    }
    this.logger.warn(
      `[EMAIL] order_cancelled: template produção (Resend/fila) pendente Task #22 — order=${payload.orderId}`,
    );
  }

  private renderShippedTemplate(p: OrderShippedEmailPayload): string {
    const itemsHtml = p.items
      .map(
        (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8db;">
          ${it.imageUrl ? `<img src="${escHtml(it.imageUrl)}" alt="" width="56" height="56" style="object-fit:cover;vertical-align:middle;margin-right:8px;" />` : ''}
          <span>${escHtml(it.name)} × ${it.quantity}</span>
        </td>
      </tr>`,
      )
      .join('');

    const est =
      p.estimatedDeliveryLabel?.trim() ||
      (p.estimatedDays != null &&
      Number.isFinite(p.estimatedDays) &&
      p.estimatedDays > 0
        ? `Em até ${p.estimatedDays} dia(s) úteis (estimativa).`
        : '');
    const estRow = est
      ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0e8db;">
            <span style="color:#a87c4f;font-size:13px;">Previsão:</span>
            <span style="float:right;color:#3d2817;font-size:14px;">${escHtml(est)}</span>
          </td>
        </tr>`
      : '';

    const content = `
      <p style="margin:0 0 16px 0;">Olá <strong>${escHtml(p.customerName)}</strong>,</p>
      <p style="margin:0 0 24px 0;">
        Seu pedido <strong>${escHtml(p.orderNumber)}</strong> foi despachado e está a caminho.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background-color:#faf7f2;padding:20px;border:1px solid #e5dcd0;">
        <tr>
          <td>
            <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#a87c4f;text-transform:uppercase;">
              Código de rastreio
            </p>
            <p style="margin:0;font-size:20px;font-family:'Courier New',monospace;color:#3d2817;letter-spacing:1px;">
              ${escHtml(p.trackingCode)}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0e8db;">
            <span style="color:#a87c4f;font-size:13px;">Forma de envio:</span>
            <span style="float:right;color:#3d2817;font-size:14px;">${escHtml(p.shippingMethod)}</span>
          </td>
        </tr>
        ${estRow}
      </table>

      <p style="margin:16px 0 8px 0;"><strong style="color:#3d2817;">Endereço de entrega</strong></p>
      <p style="margin:0 0 16px 0;">${escHtml(p.shippingAddressSummary)}</p>

      <p style="margin:24px 0 8px 0;font-size:13px;color:#a87c4f;letter-spacing:1px;text-transform:uppercase;">Itens</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${itemsHtml}</table>
    `;

    return this.renderEmailLayout({
      title: 'Seu pedido foi enviado',
      content,
      cta: { text: 'Rastrear pedido', url: p.trackingUrl },
      whatsappUrl: this.optionalUrl('WHATSAPP_SUPPORT_URL'),
      instagramUrl: this.optionalUrl('INSTAGRAM_URL'),
    });
  }

  private renderDeliveredTemplate(p: OrderDeliveredEmailPayload): string {
    const itemsHtml = p.items
      .map(
        (it) =>
          `<li style="margin:4px 0;">${escHtml(it.name)} × ${it.quantity}</li>`,
      )
      .join('');
    const content = `
      <p style="margin:0 0 16px 0;">Olá <strong>${escHtml(p.customerName)}</strong>,</p>
      <p style="margin:0 0 24px 0;">
        Confirmamos a entrega do seu pedido <strong>${escHtml(p.orderNumber)}</strong>.
      </p>
      <p style="margin:0 0 24px 0;">
        Esperamos que você ame as peças. Se quiser compartilhar sua produção com a gente,
        marca <strong>@flordemeninaoficial</strong> no Instagram — adoramos ver!
      </p>
      <p style="margin:0 0 8px 0;"><strong>Itens</strong></p>
      <ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
      <p style="margin:24px 0 0 0;"><strong>Endereço</strong><br/>${escHtml(p.shippingAddressSummary)}</p>
    `;

    return this.renderEmailLayout({
      title: 'Seu pedido foi entregue',
      content,
      whatsappUrl: this.optionalUrl('WHATSAPP_SUPPORT_URL'),
      instagramUrl: this.optionalUrl('INSTAGRAM_URL'),
    });
  }

  private renderCancelledTemplate(p: OrderCancelledEmailPayload): string {
    const reason = p.reason?.trim();
    const reasonBlock = reason
      ? `
      <p style="margin:0 0 24px 0;padding:16px;background-color:#faf7f2;border-left:3px solid #a87c4f;font-size:14px;">
        <strong style="color:#3d2817;">Motivo:</strong> ${escHtml(reason)}
      </p>`
      : '';

    const content = `
      <p style="margin:0 0 16px 0;">Olá <strong>${escHtml(p.customerName)}</strong>,</p>
      <p style="margin:0 0 16px 0;">
        Informamos que o pedido <strong>${escHtml(p.orderNumber)}</strong> foi cancelado.
      </p>
      ${reasonBlock}
      <p style="margin:0;">
        Se o pagamento já tinha sido feito, o reembolso será processado automaticamente.
        Qualquer dúvida, é só chamar a gente.
      </p>
    `;

    return this.renderEmailLayout({
      title: 'Pedido cancelado',
      content,
      whatsappUrl: this.optionalUrl('WHATSAPP_SUPPORT_URL'),
      instagramUrl: this.optionalUrl('INSTAGRAM_URL'),
    });
  }
}
