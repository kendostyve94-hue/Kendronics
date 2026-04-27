import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
