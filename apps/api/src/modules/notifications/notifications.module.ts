import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { OneSignalNotificationSender } from './onesignal-notification.sender';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository, OneSignalNotificationSender],
  exports: [NotificationsService],
})
export class NotificationsModule {}
