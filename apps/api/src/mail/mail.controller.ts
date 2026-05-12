import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma, EmailEventType, EmailStatus } from '@flor/database';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@flor/database';
import { MAIL_QUEUE } from './mail.queue';
import { renderEmailTemplate } from './templates/render';

@Controller('admin/emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
export class MailController {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  @Get('logs')
  async getLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('event') event?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (event) where.event = event as EmailEventType;
    if (status) where.status = status as EmailStatus;
    if (search)
      where.recipientEmail = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('logs/:id')
  async getLog(@Param('id') id: string) {
    const log = await prisma.emailLog.findUnique({ where: { id } });
    if (!log) throw new BadRequestException('Log não encontrado');
    return log;
  }

  @Post('logs/:id/resend')
  async resendEmail(@Param('id') id: string) {
    const log = await prisma.emailLog.findUnique({ where: { id } });
    if (!log) throw new BadRequestException('Log não encontrado');

    await prisma.emailLog.update({
      where: { id },
      data: {
        status: EmailStatus.PENDING,
        attemptCount: 0,
        errorMessage: null,
      },
    });

    await this.mailQueue.add(
      log.event,
      { logId: log.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { ok: true };
  }

  @Get('queue/status')
  async getQueueStatus() {
    const [waiting, active, failed, delayed] = await Promise.all([
      this.mailQueue.getWaitingCount(),
      this.mailQueue.getActiveCount(),
      this.mailQueue.getFailedCount(),
      this.mailQueue.getDelayedCount(),
    ]);

    return { waiting, active, failed, delayed };
  }

  @Post('queue/clean-failed')
  async cleanFailed() {
    await this.mailQueue.clean(0, 1000, 'failed');
    return { ok: true };
  }

  @Get('preview/:template')
  async previewTemplate(@Param('template') template: string) {
    const eventMap: Record<string, EmailEventType> = {
      'email-verification': EmailEventType.EMAIL_VERIFICATION,
      'password-reset': EmailEventType.PASSWORD_RESET,
      'order-created': EmailEventType.ORDER_CREATED,
      'payment-approved': EmailEventType.PAYMENT_APPROVED,
      'payment-rejected': EmailEventType.PAYMENT_REJECTED,
      'order-shipped': EmailEventType.ORDER_SHIPPED,
      'order-delivered': EmailEventType.ORDER_DELIVERED,
      'review-invitation': EmailEventType.REVIEW_INVITATION,
    };

    const event = eventMap[template];
    if (!event)
      throw new BadRequestException(`Template desconhecido: ${template}`);

    const fakePayload = buildFakePayload(event);
    const { html, subject } = await renderEmailTemplate(event, fakePayload);
    return { html, subject };
  }
}

function buildFakePayload(event: EmailEventType): Record<string, unknown> {
  const appUrl = 'http://localhost:3000';
  const orderNumber = 'FDM-2026-00042';
  const orderId = 'clx00000000000000000preview';

  const base = { name: 'Maria Silva', appUrl };

  switch (event) {
    case EmailEventType.EMAIL_VERIFICATION:
      return {
        ...base,
        verificationLink: `${appUrl}/verificar-email?token=preview-token-123`,
      };
    case EmailEventType.PASSWORD_RESET:
      return {
        ...base,
        resetLink: `${appUrl}/redefinir-senha?token=preview-token-456`,
      };
    case EmailEventType.ORDER_CREATED:
      return {
        ...base,
        orderNumber,
        orderId,
        paymentMethod: 'PIX',
        pixCopyPaste:
          '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Flor de Menina6009Maceio62070503***6304A1B2',
        items: [
          { name: 'Vestido Midi Floral (M/Azul)', quantity: 1, price: 189.9 },
          { name: 'Blusa Linho (P/Branco)', quantity: 2, price: 89.9 },
        ],
        subtotal: 369.7,
        shippingCost: 18.5,
        discount: 0,
        total: 388.2,
      };
    case EmailEventType.PAYMENT_APPROVED:
      return {
        ...base,
        orderNumber,
        orderId,
        items: [
          { name: 'Vestido Midi Floral (M/Azul)', quantity: 1, price: 189.9 },
          { name: 'Blusa Linho (P/Branco)', quantity: 2, price: 89.9 },
        ],
        total: 388.2,
      };
    case EmailEventType.PAYMENT_REJECTED:
      return {
        ...base,
        orderNumber,
        orderId,
        reason:
          'Cartão recusado pela operadora. Verifique o limite disponível.',
      };
    case EmailEventType.ORDER_SHIPPED:
      return {
        ...base,
        orderNumber,
        orderId,
        trackingCode: 'SU123456789BR',
        estimatedDays: 5,
      };
    case EmailEventType.ORDER_DELIVERED:
      return { ...base, orderNumber, orderId };
    case EmailEventType.REVIEW_INVITATION:
      return {
        ...base,
        orderNumber,
        orderId,
        items: [
          { name: 'Vestido Midi Floral', imageUrl: undefined },
          { name: 'Blusa Linho', imageUrl: undefined },
        ],
      };
    default:
      return base;
  }
}
