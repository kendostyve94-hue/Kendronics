import { UserRole } from '../../common/types/user-role.enum';
import { Order } from '../orders/entities/order.entity';
import { TrackingEvent } from './entities/tracking-event.entity';
import { User } from '../users/entities/user.entity';

export const demoTrackingUser: User = {
  id: 'demo-user-kendronics-tracking',
  email: 'client.demo@kendronics.test',
  passwordHash: 'hash:demo123',
  fullName: 'Client Demo Kendronics',
  companyName: 'Kendronics Demo Lab',
  roles: [UserRole.User],
  emailVerifiedAt: new Date('2026-04-20T09:00:00.000Z'),
  createdAt: new Date('2026-04-20T09:00:00.000Z'),
};

export const demoTrackingOrder: Order = {
  id: 'demo-order-ken-2026-0001',
  orderNumber: 'KEN-20260427-0001',
  userId: demoTrackingUser.id,
  quoteId: 'demo-quote-pcb-0001',
  destinationCountryIso2: 'SN',
  status: 'customs_processing',
  externalManufacturingPartner: 'Demo Supplier',
  externalSupplierOrderId: 'DEMO-SUP-48291',
  carrierName: 'DHL Express (DDP)',
  trackingNumber: 'JD014600009876543210',
  estimatedDeliveryAt: new Date('2026-05-03T16:00:00.000Z'),
  paidAt: new Date('2026-04-22T10:30:00.000Z'),
  createdAt: new Date('2026-04-22T10:15:00.000Z'),
  updatedAt: new Date('2026-04-27T11:00:00.000Z'),
};

export const demoTrackingEvents: TrackingEvent[] = [
  {
    id: 'demo-tracking-event-paid',
    orderId: demoTrackingOrder.id,
    status: 'paid',
    title: 'Payment confirmed',
    description: 'Your payment was confirmed and the order entered fulfillment.',
    location: 'Kendronics platform',
    occurredAt: new Date('2026-04-22T10:30:00.000Z'),
  },
  {
    id: 'demo-tracking-event-supplier-ordered',
    orderId: demoTrackingOrder.id,
    status: 'supplier_ordered',
    title: 'Production order placed',
    description: 'The PCB production order was placed with a manufacturing partner.',
    location: 'Shenzhen, China',
    occurredAt: new Date('2026-04-23T08:20:00.000Z'),
  },
  {
    id: 'demo-tracking-event-production',
    orderId: demoTrackingOrder.id,
    status: 'supplier_in_production',
    title: 'Boards in production',
    description: 'The PCB batch is being manufactured and checked.',
    location: 'Shenzhen, China',
    occurredAt: new Date('2026-04-24T14:10:00.000Z'),
  },
  {
    id: 'demo-tracking-event-france-hub',
    orderId: demoTrackingOrder.id,
    status: 'received_at_france_hub',
    title: 'Received at France hub',
    description: 'The shipment arrived at the Kendronics France coordination hub.',
    location: 'Paris, France',
    occurredAt: new Date('2026-04-26T09:45:00.000Z'),
  },
  {
    id: 'demo-tracking-event-customs',
    orderId: demoTrackingOrder.id,
    status: 'customs_processing',
    title: 'Customs processing',
    description: 'The shipment is being reviewed before local delivery.',
    location: 'Dakar, Senegal',
    occurredAt: new Date('2026-04-27T11:00:00.000Z'),
  },
];
