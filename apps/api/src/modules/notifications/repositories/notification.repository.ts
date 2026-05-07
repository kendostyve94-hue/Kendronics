import { Injectable } from '@nestjs/common';
import { Notification as PrismaNotification } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Notification } from '../entities/notification.entity';

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
};

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(toNotification);
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      return null;
    }

    const readNotification = await this.prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? new Date() },
    });

    return toNotification(readNotification);
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      },
    });

    return toNotification(notification);
  }
}

function toNotification(notification: PrismaNotification): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? undefined,
    readAt: notification.readAt ?? undefined,
    createdAt: notification.createdAt,
  };
}
