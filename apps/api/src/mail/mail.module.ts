import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MailController } from './mail.controller';
import { ResendAdapter } from './adapters/resend.adapter';
import { MaildevAdapter } from './adapters/maildev.adapter';
import { MAIL_ADAPTER } from './adapters/mail.adapter';
import { ReviewInvitationCron } from './scheduled/review-invitation.cron';
import { MAIL_QUEUE } from './mail.queue';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueueAsync({
      name: MAIL_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get<string>('REDIS_PORT', '6379')),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
  ],
  providers: [
    ResendAdapter,
    {
      provide: MAIL_ADAPTER,
      inject: [ConfigService, ResendAdapter],
      useFactory: (config: ConfigService, resend: ResendAdapter) => {
        const provider = config.get<string>('MAIL_PROVIDER', 'maildev');
        if (provider === 'resend') return resend;
        return new MaildevAdapter(config);
      },
    },
    MailService,
    MailProcessor,
    ReviewInvitationCron,
  ],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}
