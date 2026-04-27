import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';

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
    return this.prisma.order.findUnique({ where: { id } }) as Promise<Order | null>;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Order[]>;
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<Order[]>;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : undefined,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
      },
    }) as Promise<Order>;
  }

  async updateSupplierReference(
    id: string,
    input: { externalManufacturingPartner: string; externalSupplierOrderId: string },
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: input,
    }) as Promise<Order>;
  }

  async updateShipment(
    id: string,
    input: { carrierName?: string; trackingNumber?: string; estimatedDeliveryAt?: Date },
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        carrierName: input.carrierName,
        trackingNumber: input.trackingNumber,
        estimatedDeliveryAt: input.estimatedDeliveryAt,
      },
    }) as Promise<Order>;
  }
}
