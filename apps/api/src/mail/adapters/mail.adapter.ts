export interface MailAdapter {
  send(to: string, subject: string, html: string): Promise<void>;
  sendWithId(to: string, subject: string, html: string): Promise<string>;
}

export const MAIL_ADAPTER = 'MAIL_ADAPTER';
