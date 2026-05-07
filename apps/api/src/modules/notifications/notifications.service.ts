import { Injectable } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  listForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  markRead(userId: string, id: string): Promise<Notification | null> {
    return this.notificationRepository.markRead(userId, id);
  }

  create(input: { userId: string; type: string; title: string; body?: string }): Promise<Notification> {
    return this.notificationRepository.create(input);
  }
}
