import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { isPublicTrackingStatus } from './entities/tracking-timeline.entity';
import { UsersService } from '../users/users.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { PublicTrackingLookupDto } from './dto/public-tracking-lookup.dto';
import { TrackingEvent } from './entities/tracking-event.entity';
import { TrackingTimeline } from './entities/tracking-timeline.entity';
import { TrackingRepository } from './repositories/tracking.repository';

@Injectable()
export class TrackingService {
  constructor(
    private readonly trackingRepository: TrackingRepository,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  getOrderTracking(userId: string, orderId: string): Promise<TrackingEvent[]> {
    return this.trackingRepository.findForOwnedOrder(userId, orderId);
  }

  async lookupByOrderAndEmail(dto: PublicTrackingLookupDto): Promise<TrackingTimeline> {
    const order = await this.ordersService.findByIdForInternal(dto.orderId);
    const owner = await this.usersService.findById(order.userId);

    if (!owner || owner.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new ForbiddenException('Order email does not match.');
    }

    const events = (await this.trackingRepository.findPublicEventsForOrder(order.id)).filter((event) =>
      isPublicTrackingStatus(event.status),
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      destinationCountryIso2: order.destinationCountryIso2,
      carrierName: order.carrierName,
      trackingNumber: order.trackingNumber,
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      events,
    };
  }

  async addAdminStatusEvent(orderId: string, status: OrderStatus, note?: string): Promise<TrackingEvent> {
    const event = await this.trackingRepository.addEvent({
      orderId,
      status,
      title: humanizeStatus(status),
      description: note,
    });
    const order = await this.ordersService.findByIdForInternal(orderId);
    await this.notificationsService.create({
      userId: order.userId,
      type: 'order.status.updated',
      title: 'Statut de commande mis a jour',
      body: `Votre commande ${order.orderNumber} est maintenant : ${humanizeStatus(status)}.${note ? ` ${note}` : ''}`,
    });
    return event;
  }

  async addManualEvent(orderId: string, dto: CreateTrackingEventDto): Promise<TrackingEvent> {
    const event = await this.trackingRepository.addEvent({
      orderId,
      status: dto.status,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    });
    const order = await this.ordersService.findByIdForInternal(orderId);
    await this.notificationsService.create({
      userId: order.userId,
      type: 'order.tracking.updated',
      title: 'Suivi de commande mis a jour',
      body: `${dto.title}${dto.description ? ` - ${dto.description}` : ''}`,
    });
    return event;
  }
}

function humanizeStatus(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
