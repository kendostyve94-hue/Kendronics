import { Module } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { SupportTicketRepository } from './repositories/support-ticket.repository';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportTicketRepository, EmailNotificationService],
  exports: [SupportService, EmailNotificationService],
})
export class SupportModule {}
