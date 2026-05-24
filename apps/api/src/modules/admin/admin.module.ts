import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { SupportModule } from '../support/support.module';
import { TrackingModule } from '../tracking/tracking.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminTotpGuard } from './admin-totp.guard';
import { AdminTotpService } from './admin-totp.service';
import { AdminAuditRepository } from './repositories/admin-audit.repository';

@Module({
  imports: [OrdersModule, PaymentsModule, PricingModule, TrackingModule, SupportModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditRepository, AdminTotpService, AdminTotpGuard],
})
export class AdminModule {}
