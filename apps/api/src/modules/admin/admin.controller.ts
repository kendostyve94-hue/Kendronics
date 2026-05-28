import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
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
import { SupplierReviewResultDto } from '../payments/dto/order-workflow.dto';
import { CreateTrackingEventDto } from '../tracking/dto/create-tracking-event.dto';
import { AdminTotpGuard } from './admin-totp.guard';
import { AdminService } from './admin.service';
import { AdminTotpService } from './admin-totp.service';

class AddAdminUserDto {
  @IsEmail()
  email!: string;

  @IsEmail()
  professionalEmail!: string;

  @IsOptional()
  @IsString({ each: true })
  accessRoles?: string[];
}

class StartAdminCodeDto {
  @IsEmail()
  adminEmail!: string;
}

class VerifyAdminCodeDto {
  @IsEmail()
  adminEmail!: string;

  @IsString()
  code!: string;
}

class SetupAdminCodeDto extends VerifyAdminCodeDto {
  @IsString()
  personalCode!: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminTotpGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminTotpService: AdminTotpService,
  ) {}

  @Post('access/code/start')
  startAdminCode(@CurrentUser() admin: AuthenticatedUser, @Body() dto: StartAdminCodeDto, @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
    return this.adminTotpService.startCodeFlow(admin, dto.adminEmail, clientIp(request));
  }

  @Post('access/code/setup')
  setupAdminCode(@CurrentUser() admin: AuthenticatedUser, @Body() dto: SetupAdminCodeDto, @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
    return this.adminTotpService.setupPersonalCode(admin, dto.adminEmail, dto.code, dto.personalCode, clientIp(request));
  }

  @Post('access/code/verify')
  verifyAdminCode(@CurrentUser() admin: AuthenticatedUser, @Body() dto: VerifyAdminCodeDto, @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
    return this.adminTotpService.verifyPersonalCode(admin, dto.adminEmail, dto.code, clientIp(request));
  }

  @Get('access/admins')
  listAdminUsers(@CurrentUser() admin: AuthenticatedUser) {
    return this.adminService.listAdminUsers(admin);
  }

  @Post('access/admins')
  addAdminUser(@CurrentUser() admin: AuthenticatedUser, @Body() dto: AddAdminUserDto) {
    return this.adminService.addAdminUser(admin, dto.email, dto.professionalEmail, dto.accessRoles);
  }

  @Delete('access/admins/:accessId')
  removeAdminUser(@CurrentUser() admin: AuthenticatedUser, @Param('accessId') accessId: string) {
    return this.adminService.removeAdminUser(admin, accessId);
  }

  @Post('access/admins/:accessId/reset-code')
  resetAdminCode(@CurrentUser() admin: AuthenticatedUser, @Param('accessId') accessId: string, @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
    return this.adminTotpService.resetPersonalCode(admin, accessId, clientIp(request));
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

  @Post('orders/:orderId/supplier-review-result')
  recordSupplierReviewResult(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: SupplierReviewResultDto,
  ) {
    return this.adminService.recordSupplierReviewResult(admin, orderId, dto);
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

function clientIp(request: { ip?: string; headers: Record<string, string | string[] | undefined> }): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(',')[0]?.trim() || request.ip;
}
