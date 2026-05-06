import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailAdapter } from './adapters/mail.adapter';
import { MaildevAdapter } from './adapters/maildev.adapter';
import { ResendAdapter } from './adapters/resend.adapter';
import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class MailService {
  private adapter: MailAdapter;

  constructor(private config: ConfigService) {
    const provider = this.config.get<string>('MAIL_PROVIDER') || 'maildev';
    if (provider === 'maildev') {
      this.adapter = new MaildevAdapter(config);
    } else if (provider === 'resend') {
      this.adapter = new ResendAdapter();
    } else {
      throw new Error(`MAIL_PROVIDER inválido: ${provider}`);
    }
  }

  async sendVerification(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/verificar-email?token=${token}`;
    const html = verificationTemplate(name, link);
    await this.adapter.send(to, 'Confirme seu e-mail — Flor de Menina', html);
  }

  async sendPasswordReset(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/redefinir-senha?token=${token}`;
    const html = passwordResetTemplate(name, link);
    await this.adapter.send(to, 'Redefinir senha — Flor de Menina', html);
  }
}
