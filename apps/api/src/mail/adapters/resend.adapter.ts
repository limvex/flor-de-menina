import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { MailAdapter } from './mail.adapter';

@Injectable()
export class ResendAdapter implements MailAdapter {
  private client: Resend | null = null;
  private readonly logger = new Logger(ResendAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private getClient(): Resend {
    if (!this.client) {
      const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.sendWithId(to, subject, html);
  }

  async sendWithId(to: string, subject: string, html: string): Promise<string> {
    const client = this.getClient();
    const from = this.config.get<string>(
      'RESEND_FROM_EMAIL',
      'Flor de Menina <contato@flordemenina.store>',
    );
    const replyToAddr = this.config.get<string>(
      'RESEND_REPLY_TO',
      'contato@flordemenina.store',
    );

    const { data, error } = await client.emails.send({
      from,
      replyTo: replyToAddr,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    this.logger.log(`Email sent via Resend: id=${data?.id} to=${to}`);
    return data!.id;
  }
}
