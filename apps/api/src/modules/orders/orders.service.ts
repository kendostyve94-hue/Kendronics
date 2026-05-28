import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderQuoteDto } from './dto/update-order-quote.dto';
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
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly pricingService: PricingService,
  ) {}

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

  async updateOwnedOrderQuantity(userId: string, orderId: string, quantity: number): Promise<Order> {
    const order = await this.findOwnedOrder(userId, orderId);
    if (!order.quoteSnapshot) {
      throw new BadRequestException('This order cannot be updated because no quote is attached.');
    }
    if (!['draft', 'quoted', 'awaiting_payment'].includes(order.status)) {
      throw new BadRequestException('Only unpaid orders can be updated.');
    }

    const quote = order.quoteSnapshot;
    const configSnapshot = {
      ...(quote.configSnapshot ?? {}),
      quantity,
    };
    const nextQuote = await this.pricingService.createQuote(userId, {
      productType: quote.productType,
      gerberFileId: quote.gerberFileId,
      bomFileId: quote.bomFileId,
      cplFileId: quote.cplFileId,
      layers: quote.layers,
      lengthMm: quote.lengthMm,
      widthMm: quote.widthMm,
      quantity,
      destinationCountryIso2: order.destinationCountryIso2,
      shippingMode: quote.shippingMode as 'economy' | 'standard' | 'express',
      configSnapshot,
    });

    return this.ordersRepository.updateQuote(order.id, nextQuote.id);
  }

  async updateOwnedOrderQuote(userId: string, orderId: string, dto: UpdateOrderQuoteDto): Promise<Order> {
    const order = await this.findOwnedOrder(userId, orderId);
    if (!['draft', 'quoted', 'awaiting_payment'].includes(order.status)) {
      throw new BadRequestException('Only unpaid orders can be updated.');
    }

    const nextQuote = await this.pricingService.createQuote(userId, dto);
    return this.ordersRepository.updateQuote(order.id, nextQuote.id);
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

  listRecentPublicActivity(limit = 6): Promise<Order[]> {
    return this.ordersRepository.findRecentPublicActivity(limit);
  }

  async markPaidFromVerifiedPayment(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.ordersRepository.updateStatus(orderId, 'paid');
  }

  async markPaymentAuthorizedFromVerifiedPayment(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status === 'awaiting_payment') {
      return this.ordersRepository.updateStatus(orderId, 'payment_authorized');
    }

    return order;
  }

  async cancelAfterPaymentAuthorizationReleased(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (['payment_authorized', 'supplier_review_pending', 'supplier_files_rejected', 'awaiting_payment'].includes(order.status)) {
      return this.ordersRepository.updateStatus(orderId, 'cancelled');
    }

    return order;
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
