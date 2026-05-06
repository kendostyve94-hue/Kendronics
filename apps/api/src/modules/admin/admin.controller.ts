import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/types/user-role.enum';
import {
  AddSupplierOrderReferenceDto,
  UpdateOrderStatusDto,
  UpdateShipmentDto,
} from '../orders/dto/admin-order-update.dto';
import { UpsertPricingRuleDto } from '../pricing/dto/upsert-pricing-rule.dto';
import { PrepareSupplierOrderDto } from '../pricing/dto/prepare-supplier-order.dto';
import { RecordSupplierRealPriceDto } from '../pricing/dto/record-supplier-real-price.dto';
import { CreateTrackingEventDto } from '../tracking/dto/create-tracking-event.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  listOrders(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listOrders(admin);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(admin, orderId, dto);
  }

  @Post('orders/:orderId/supplier-reference')
  addSupplierReference(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: AddSupplierOrderReferenceDto,
  ) {
    return this.adminService.addSupplierReference(admin, orderId, dto);
  }

  @Post('orders/:orderId/supplier-real-price')
  recordSupplierRealPrice(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: RecordSupplierRealPriceDto,
  ) {
    return this.adminService.recordSupplierRealPrice(admin, orderId, dto);
  }

  @Post('orders/:orderId/supplier-order')
  prepareSupplierOrder(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: PrepareSupplierOrderDto,
  ) {
    return this.adminService.prepareSupplierOrder(admin, orderId, dto);
  }

  @Patch('orders/:orderId/shipment')
  updateShipment(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.adminService.updateShipment(admin, orderId, dto);
  }

  @Post('orders/:orderId/tracking-events')
  addTrackingEvent(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: CreateTrackingEventDto,
  ) {
    return this.adminService.addTrackingEvent(admin, orderId, dto);
  }

  @Get('pricing-rules')
  listPricingRules(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listPricingRules(admin);
  }

  @Get('pricing-intelligence')
  pricingIntelligence(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.getPricingIntelligence(admin);
  }

  @Post('pricing-rules')
  createPricingRule(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpsertPricingRuleDto) {
    return this.adminService.createPricingRule(admin, dto);
  }

  @Patch('pricing-rules')
  updatePricingRule(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpsertPricingRuleDto) {
    return this.adminService.updatePricingRule(admin, dto);
  }

  @Get('support-tickets')
  listSupportTickets(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listSupportTickets(admin);
  }

  @Get('audit-logs')
  listAuditLogs(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listAuditLogs(admin);
  }
}
