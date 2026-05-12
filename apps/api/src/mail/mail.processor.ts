import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { prisma, EmailEventType } from '@flor/database';
import type { MailAdapter } from './adapters/mail.adapter';
import { MAIL_ADAPTER } from './adapters/mail.adapter';
import { MAIL_QUEUE, type MailJobData } from './mail.queue';
import { renderEmailTemplate } from './templates/render';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(@Inject(MAIL_ADAPTER) private readonly adapter: MailAdapter) {
    super();
  }

  async process(job: Job<MailJobData>): Promise<void> {
    const log = await prisma.emailLog.findUnique({
      where: { id: job.data.logId },
    });

    if (!log) {
      this.logger.error(`EmailLog not found: ${job.data.logId}`);
      throw new Error(`EmailLog ${job.data.logId} not found`);
    }

    if (log.status === 'SENT') {
      this.logger.log(`Email already sent, skipping: logId=${log.id}`);
      return;
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { attemptCount: { increment: 1 }, status: 'RETRYING' },
    });

    try {
      const { html, subject } = await renderEmailTemplate(
        log.event as EmailEventType,
        log.payload as Record<string, unknown>,
      );

      const resendId = await this.adapter.sendWithId(
        log.recipientEmail,
        subject,
        html,
      );

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          resendId,
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(
        `Email sent: logId=${log.id} event=${log.event} resendId=${resendId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', errorMessage: message },
      });

      this.logger.error(
        `Email failed: logId=${log.id} event=${log.event} error=${message}`,
      );
      throw error;
    }
  }
}
