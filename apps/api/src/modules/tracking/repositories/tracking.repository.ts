import { Injectable } from '@nestjs/common';
import { demoTrackingEvents, demoTrackingOrder } from '../demo-tracking-data';
import { TrackingEvent } from '../entities/tracking-event.entity';

@Injectable()
export class TrackingRepository {
  private readonly events = new Map<string, TrackingEvent[]>();

  constructor() {
    this.events.set(demoTrackingOrder.id, demoTrackingEvents);
  }

  async findForOwnedOrder(userId: string, orderId: string): Promise<TrackingEvent[]> {
    void userId;
    return this.events.get(orderId) ?? [
      {
        id: crypto.randomUUID(),
        orderId,
        status: 'awaiting_payment',
        title: 'Order created',
        occurredAt: new Date(),
      },
    ];
  }

  async findPublicEventsForOrder(orderId: string): Promise<TrackingEvent[]> {
    return this.events.get(orderId) ?? [];
  }

  async addEvent(input: {
    orderId: string;
    status: string;
    title: string;
    description?: string;
    location?: string;
    occurredAt?: Date;
  }): Promise<TrackingEvent> {
    const event: TrackingEvent = {
      id: crypto.randomUUID(),
      orderId: input.orderId,
      status: input.status,
      title: input.title,
      description: input.description,
      location: input.location,
      occurredAt: input.occurredAt ?? new Date(),
    };

    const existing = this.events.get(input.orderId) ?? [];
    existing.push(event);
    this.events.set(input.orderId, existing);
    return event;
  }
}
