import { Injectable } from '@nestjs/common';
import { demoTrackingOrder } from '../../tracking/demo-tracking-data';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class OrdersRepository {
  private readonly orders = new Map<string, Order>();

  constructor() {
    this.orders.set(demoTrackingOrder.id, demoTrackingOrder);
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `KEN-${Date.now()}`,
      userId,
      quoteId: dto.quoteId,
      destinationCountryIso2: dto.destinationCountryIso2,
      status: 'awaiting_payment',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return [...this.orders.values()].filter((order) => order.userId === userId);
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()];
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error('Order not found.');
    }

    order.status = status;
    order.updatedAt = new Date();
    if (status === 'paid') {
      order.paidAt = new Date();
    }
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    return order;
  }

  async updateSupplierReference(
    id: string,
    input: { externalManufacturingPartner: string; externalSupplierOrderId: string },
  ): Promise<Order> {
    const order = this.mustFind(id);
    order.externalManufacturingPartner = input.externalManufacturingPartner;
    order.externalSupplierOrderId = input.externalSupplierOrderId;
    order.updatedAt = new Date();
    return order;
  }

  async updateShipment(
    id: string,
    input: { carrierName?: string; trackingNumber?: string; estimatedDeliveryAt?: Date },
  ): Promise<Order> {
    const order = this.mustFind(id);
    order.carrierName = input.carrierName ?? order.carrierName;
    order.trackingNumber = input.trackingNumber ?? order.trackingNumber;
    order.estimatedDeliveryAt = input.estimatedDeliveryAt ?? order.estimatedDeliveryAt;
    order.updatedAt = new Date();
    return order;
  }

  private mustFind(id: string): Order {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error('Order not found.');
    }

    return order;
  }
}
