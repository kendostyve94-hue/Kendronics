import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PricingModule } from '../pricing/pricing.module';
import { SupportModule } from '../support/support.module';
import { TrackingModule } from '../tracking/tracking.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditRepository } from './repositories/admin-audit.repository';

@Module({
  imports: [OrdersModule, PricingModule, TrackingModule, SupportModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditRepository],
})
export class AdminModule {}
