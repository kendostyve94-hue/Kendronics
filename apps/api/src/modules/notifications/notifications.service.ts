import { Injectable, Logger } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { OneSignalNotificationSender } from './onesignal-notification.sender';
import { NotificationRepository } from './repositories/notification.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly oneSignalSender: OneSignalNotificationSender,
  ) {}

  listForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  markRead(userId: string, id: string): Promise<Notification | null> {
    return this.notificationRepository.markRead(userId, id);
  }

  async create(input: { userId: string; type: string; title: string; body?: string }): Promise<Notification> {
    const notification = await this.notificationRepository.create(input);
    void this.oneSignalSender.send(notification).catch((error) => {
      this.logger.warn(`OneSignal notification delivery failed: ${error instanceof Error ? error.message : String(error)}`);
    });
    return notification;
  }
}
