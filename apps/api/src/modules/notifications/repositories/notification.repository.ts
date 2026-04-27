import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  private readonly notifications = new Map<string, Notification>();

  async findByUserId(userId: string): Promise<Notification[]> {
    return [...this.notifications.values()].filter((notification) => notification.userId === userId);
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) {
      return null;
    }

    notification.readAt = new Date();
    return notification;
  }
}
