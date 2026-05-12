import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [MailModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
