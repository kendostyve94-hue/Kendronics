import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  AddSupplierOrderReferenceDto,
  UpdateOrderStatusDto,
  UpdateShipmentDto,
} from './dto/admin-order-update.dto';
import { Order } from './entities/order.entity';
import { canTransitionOrderStatus } from './entities/order-status-transition';
import { OrdersRepository } from './repositories/orders.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.ordersRepository.create(userId, dto);
  }

  listForUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.findByUserId(userId);
  }

  async findOwnedOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order.');
    }
    return order;
  }

  async deleteOwnedOrder(userId: string, orderId: string): Promise<void> {
    await this.findOwnedOrder(userId, orderId);
    await this.ordersRepository.delete(orderId);
  }

  async findByIdForInternal(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  listForAdmin(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  async markPaidFromVerifiedPayment(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.ordersRepository.updateStatus(orderId, 'paid');
  }

  async updateStatusFromAdmin(orderId: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findByIdForInternal(orderId);
    if (!canTransitionOrderStatus(order.status, dto.status)) {
      throw new BadRequestException(`Cannot transition order from ${order.status} to ${dto.status}.`);
    }

    return this.ordersRepository.updateStatus(orderId, dto.status);
  }

  updateSupplierReferenceFromAdmin(
    orderId: string,
    dto: AddSupplierOrderReferenceDto,
  ): Promise<Order> {
    return this.ordersRepository.updateSupplierReference(orderId, dto);
  }

  updateShipmentFromAdmin(orderId: string, dto: UpdateShipmentDto): Promise<Order> {
    return this.ordersRepository.updateShipment(orderId, {
      carrierName: dto.carrierName,
      trackingNumber: dto.trackingNumber,
      estimatedDeliveryAt: dto.estimatedDeliveryAt ? new Date(dto.estimatedDeliveryAt) : undefined,
    });
  }
}
