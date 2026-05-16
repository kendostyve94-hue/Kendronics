import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
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
import { TestSupplierConnectionDto } from '../pricing/dto/test-supplier-connection.dto';
import { CreateTrackingEventDto } from '../tracking/dto/create-tracking-event.dto';
import { AdminTotpGuard } from './admin-totp.guard';
import { AdminService } from './admin.service';
import { AdminTotpService } from './admin-totp.service';

class AddAdminUserDto {
  @IsEmail()
  email!: string;
}

class VerifyAdminTotpDto {
  @IsString()
  username!: string;

  @IsString()
  code!: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminTotpGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminTotpService: AdminTotpService,
  ) {}

  @Post('access/totp/verify')
  verifyAdminTotp(@CurrentUser() admin: AuthenticatedUser, @Body() dto: VerifyAdminTotpDto) {
    return this.adminTotpService.verifyCode(admin, dto.username, dto.code);
  }

  @Get('access/admins')
  listAdminUsers(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listAdminUsers(admin);
  }

  @Post('access/admins')
  addAdminUser(@CurrentUser() admin: AuthenticatedUser, @Body() dto: AddAdminUserDto) {
    return this.adminService.addAdminUser(admin, dto.email);
  }

  @Delete('access/admins/:userId')
  removeAdminUser(@CurrentUser() admin: AuthenticatedUser, @Param('userId') userId: string) {
    return this.adminService.removeAdminUser(admin, userId);
  }

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

  @Post('supplier-connection-test')
  testSupplierConnection(@CurrentUser() admin: AuthenticatedUser, @Body() dto: TestSupplierConnectionDto) {
    return this.adminService.testSupplierConnection(admin, dto);
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
