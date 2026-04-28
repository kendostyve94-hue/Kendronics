import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';

type OrderRecord = Omit<
  Order,
  | 'status'
  | 'currency'
  | 'paymentStatus'
  | 'totalPrice'
  | 'externalManufacturingPartner'
  | 'externalSupplierOrderId'
  | 'carrierName'
  | 'trackingNumber'
  | 'estimatedDeliveryAt'
  | 'paidAt'
  | 'deliveredAt'
> & {
  status: string;
  externalManufacturingPartner: string | null;
  externalSupplierOrderId: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  estimatedDeliveryAt: Date | null;
  paidAt: Date | null;
  deliveredAt: Date | null;
  quote?: { finalTotal: Prisma.Decimal; currency: string } | null;
  payments?: Array<{ status: string }>;
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.prisma.order.create({
      data: {
        orderNumber: `KEN-${Date.now()}`,
        userId,
        quoteId: dto.quoteId,
        destinationCountryIso2: dto.destinationCountryIso2,
        status: 'awaiting_payment',
      },
    }) as Promise<Order>;
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return order ? this.toOrder(order) : null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return orders.map((order) => this.toOrder(order));
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return orders.map((order) => this.toOrder(order));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : undefined,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
      },
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return this.toOrder(order);
  }

  async updateSupplierReference(
    id: string,
    input: { externalManufacturingPartner: string; externalSupplierOrderId: string },
  ): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: input,
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return this.toOrder(order);
  }

  async updateShipment(
    id: string,
    input: { carrierName?: string; trackingNumber?: string; estimatedDeliveryAt?: Date },
  ): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        carrierName: input.carrierName,
        trackingNumber: input.trackingNumber,
        estimatedDeliveryAt: input.estimatedDeliveryAt,
      },
      include: { quote: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return this.toOrder(order);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  private toOrder(order: OrderRecord): Order {
    const latestPayment = order.payments?.[0];
    const paymentStatus =
      order.status === 'paid' || latestPayment?.status === 'succeeded'
        ? 'paid'
        : latestPayment?.status === 'failed'
          ? 'failed'
          : 'pending';

    return {
      ...order,
      status: order.status as OrderStatus,
      externalManufacturingPartner: order.externalManufacturingPartner ?? undefined,
      externalSupplierOrderId: order.externalSupplierOrderId ?? undefined,
      carrierName: order.carrierName ?? undefined,
      trackingNumber: order.trackingNumber ?? undefined,
      estimatedDeliveryAt: order.estimatedDeliveryAt ?? undefined,
      paidAt: order.paidAt ?? undefined,
      deliveredAt: order.deliveredAt ?? undefined,
      totalPrice: order.quote ? order.quote.finalTotal.toNumber() : undefined,
      currency: order.quote?.currency === 'EUR' ? 'EUR' : undefined,
      paymentStatus,
    };
  }
}
