import { MailAdapter } from './mail.adapter';

// Placeholder — será implementado na Task #22 (E-mails transacionais)
export class ResendAdapter implements MailAdapter {
  async send(_to: string, _subject: string, _html: string): Promise<void> {
    throw new Error('ResendAdapter ainda não implementado. Veja Task #22.');
  }
}
