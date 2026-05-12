import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import type { MailAdapter } from './mail.adapter';

export class MaildevAdapter implements MailAdapter {
  private transporter: nodemailer.Transporter;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST') || 'localhost',
      port: Number(config.get<string>('SMTP_PORT') || 1025),
      secure: false,
      auth: config.get('SMTP_USER')
        ? {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.sendWithId(to, subject, html);
  }

  async sendWithId(to: string, subject: string, html: string): Promise<string> {
    const info = await this.transporter.sendMail({
      from: `"Flor de Menina" <${process.env.MAIL_FROM_EMAIL || 'contato@flordemenina.store'}>`,
      to,
      subject,
      html,
    });
    return (info.messageId as string) ?? `maildev-${Date.now()}`;
  }
}
