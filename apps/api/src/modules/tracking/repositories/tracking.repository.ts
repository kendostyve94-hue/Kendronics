import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrackingEvent } from '../entities/tracking-event.entity';

@Injectable()
export class TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForOwnedOrder(userId: string, orderId: string): Promise<TrackingEvent[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        orderId,
        order: { userId },
      },
      orderBy: { occurredAt: 'desc' },
    });
    return events.map((event) => this.toTrackingEvent(event));
  }

  async findPublicEventsForOrder(orderId: string): Promise<TrackingEvent[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: { orderId },
      orderBy: { occurredAt: 'desc' },
    });
    return events.map((event) => this.toTrackingEvent(event));
  }

  async addEvent(input: {
    orderId: string;
    status: string;
    title: string;
    description?: string;
    location?: string;
    occurredAt?: Date;
  }): Promise<TrackingEvent> {
    const event = await this.prisma.trackingEvent.create({
      data: {
        orderId: input.orderId,
        status: input.status,
        title: input.title,
        description: input.description,
        location: input.location,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
    return this.toTrackingEvent(event);
  }

  private toTrackingEvent(event: {
    id: string;
    orderId: string;
    status: string;
    title: string;
    description: string | null;
    location: string | null;
    occurredAt: Date;
  }): TrackingEvent {
    return {
      id: event.id,
      orderId: event.orderId,
      status: event.status,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      occurredAt: event.occurredAt,
    };
  }
}
