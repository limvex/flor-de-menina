export interface MailAdapter {
  send(to: string, subject: string, html: string): Promise<void>;
}
