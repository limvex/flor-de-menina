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

  private whatsappFooterHtml(): string {
    const url = this.config.get<string>('WHATSAPP_SUPPORT_URL', '').trim();
    if (!url) {
      return '<p style="font-size:12px;color:#888;">Se tiver dúvidas, fale com a gente pelo site da loja.</p>';
    }
    return `<p style="font-size:12px;color:#888;">Se tiver dúvidas, fale com a gente no <a href="${escHtml(url)}">WhatsApp</a>.</p>`;
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
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${it.imageUrl ? `<img src="${escHtml(it.imageUrl)}" alt="" width="56" height="56" style="object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;" />` : ''}
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
    const estHtml = est
      ? `<p><strong>Previsão:</strong> ${escHtml(est)}</p>`
      : '';

    return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <h1 style="color:#6b4226;">Seu pedido foi enviado</h1>
  <p>Olá ${escHtml(p.customerName)},</p>
  <p>O pedido <strong>${escHtml(p.orderNumber)}</strong> foi despachado e está a caminho.</p>
  <div style="background:#f5f0ea;padding:16px;border-radius:8px;margin:24px 0;">
    <p style="margin:0;"><strong>Código de rastreio</strong></p>
    <p style="font-size:18px;font-family:monospace;margin:8px 0;">${escHtml(p.trackingCode)}</p>
    <a href="${escHtml(p.trackingUrl)}" style="display:inline-block;background:#6b4226;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Rastrear pedido</a>
  </div>
  <p><strong>Forma de envio:</strong> ${escHtml(p.shippingMethod)}</p>
  ${estHtml}
  <p><strong>Endereço de entrega</strong><br/>${escHtml(p.shippingAddressSummary)}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;">${itemsHtml}</table>
  <hr style="border:0;border-top:1px solid #ddd;margin:32px 0;" />
  ${this.whatsappFooterHtml()}
  <p style="font-size:12px;color:#888;">Flor de Menina · Maceió/AL</p>
</body></html>`;
  }

  private renderDeliveredTemplate(p: OrderDeliveredEmailPayload): string {
    const itemsHtml = p.items
      .map((it) => `<li>${escHtml(it.name)} × ${it.quantity}</li>`)
      .join('');
    return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h1 style="color:#6b4226;">Entrega confirmada</h1>
  <p>Olá ${escHtml(p.customerName)},</p>
  <p>O pedido <strong>${escHtml(p.orderNumber)}</strong> consta como entregue. Esperamos que ame cada peça!</p>
  <p><strong>Itens</strong></p>
  <ul>${itemsHtml}</ul>
  <p><strong>Endereço</strong><br/>${escHtml(p.shippingAddressSummary)}</p>
  <hr style="border:0;border-top:1px solid #ddd;margin:32px 0;" />
  ${this.whatsappFooterHtml()}
</body></html>`;
  }

  private renderCancelledTemplate(p: OrderCancelledEmailPayload): string {
    const reason = p.reason?.trim();
    return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h1 style="color:#6b4226;">Pedido cancelado</h1>
  <p>Olá ${escHtml(p.customerName)},</p>
  <p>O pedido <strong>${escHtml(p.orderNumber)}</strong> foi cancelado pela loja.</p>
  ${reason ? `<p>Motivo: ${escHtml(reason)}</p>` : ''}
  <hr style="border:0;border-top:1px solid #ddd;margin:32px 0;" />
  ${this.whatsappFooterHtml()}
</body></html>`;
  }
}
