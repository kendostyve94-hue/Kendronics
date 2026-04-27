import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  AddSupplierOrderReferenceDto,
  UpdateOrderStatusDto,
  UpdateShipmentDto,
} from '../orders/dto/admin-order-update.dto';
import { OrdersService } from '../orders/orders.service';
import { UpsertPricingRuleDto } from '../pricing/dto/upsert-pricing-rule.dto';
import { PricingRuleRepository } from '../pricing/repositories/pricing-rule.repository';
import { SupportService } from '../support/support.service';
import { CreateTrackingEventDto } from '../tracking/dto/create-tracking-event.dto';
import { TrackingService } from '../tracking/tracking.service';
import { AdminAuditRepository } from './repositories/admin-audit.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pricingRules: PricingRuleRepository,
    private readonly trackingService: TrackingService,
    private readonly auditRepository: AdminAuditRepository,
    private readonly supportService: SupportService,
  ) {}

  async listOrders(admin: AuthenticatedUser) {
    await this.auditRepository.record(admin.id, 'admin.orders.list', 'order');
    return this.ordersService.listForAdmin();
  }

  async updateOrderStatus(admin: AuthenticatedUser, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.ordersService.updateStatusFromAdmin(orderId, dto);
    await this.trackingService.addAdminStatusEvent(orderId, dto.status, dto.note);
    await this.auditRepository.record(admin.id, 'admin.orders.status.update', 'order', orderId);
    return order;
  }

  async addSupplierReference(
    admin: AuthenticatedUser,
    orderId: string,
    dto: AddSupplierOrderReferenceDto,
  ) {
    const order = await this.ordersService.updateSupplierReferenceFromAdmin(orderId, dto);
    await this.auditRepository.record(admin.id, 'admin.orders.supplier_reference.update', 'order', orderId);
    return order;
  }

  async updateShipment(admin: AuthenticatedUser, orderId: string, dto: UpdateShipmentDto) {
    const order = await this.ordersService.updateShipmentFromAdmin(orderId, dto);
    await this.auditRepository.record(admin.id, 'admin.orders.shipment.update', 'order', orderId);
    return order;
  }

  async addTrackingEvent(admin: AuthenticatedUser, orderId: string, dto: CreateTrackingEventDto) {
    const event = await this.trackingService.addManualEvent(orderId, dto);
    await this.auditRepository.record(admin.id, 'admin.orders.tracking_event.create', 'order', orderId);
    return event;
  }

  async listPricingRules(admin: AuthenticatedUser) {
    await this.auditRepository.record(admin.id, 'admin.pricing_rules.list', 'pricing_rule');
    return this.pricingRules.getActiveRules();
  }

  async createPricingRule(admin: AuthenticatedUser, dto: UpsertPricingRuleDto) {
    await this.auditRepository.record(admin.id, 'admin.pricing_rules.create', 'pricing_rule');
    return { ...dto, id: crypto.randomUUID(), createdAt: new Date() };
  }

  async updatePricingRule(admin: AuthenticatedUser, dto: UpsertPricingRuleDto) {
    await this.auditRepository.record(admin.id, 'admin.pricing_rules.update', 'pricing_rule');
    return { ...dto, updatedAt: new Date() };
  }

  async listSupportTickets(admin: AuthenticatedUser) {
    await this.auditRepository.record(admin.id, 'admin.support_tickets.list', 'support_ticket');
    return this.supportService.listAllTickets();
  }

  async listAuditLogs(admin: AuthenticatedUser) {
    await this.auditRepository.record(admin.id, 'admin.audit_logs.list', 'audit_log');
    return this.auditRepository.findRecent();
  }
}
