import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { prisma, EmailEventType, OrderStatus } from '@flor/database';
import { MailService } from '../mail.service';

@Injectable()
export class ReviewInvitationCron {
  private readonly logger = new Logger(ReviewInvitationCron.name);

  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 10 * * *')
  async sendReviewInvitations(): Promise<void> {
    const delayDays = Number(
      this.config.get<string>('REVIEW_INVITATION_DELAY_DAYS', '7'),
    );
    const cutoff = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        shippedAt: { lte: cutoff },
        status: { in: [OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        NOT: {
          emailLogs: {
            some: {
              event: EmailEventType.REVIEW_INVITATION,
              status: { in: ['SENT', 'PENDING', 'RETRYING'] },
            },
          },
        },
      },
      select: { id: true },
      take: 100,
    });

    this.logger.log(
      `ReviewInvitationCron: encontrados ${orders.length} pedidos elegíveis`,
    );

    for (const order of orders) {
      try {
        await this.mailService.sendReviewInvitation(order.id);
      } catch (error) {
        this.logger.error(
          `ReviewInvitationCron: falha no pedido ${order.id}: ${String(error)}`,
        );
      }
    }
  }
}
