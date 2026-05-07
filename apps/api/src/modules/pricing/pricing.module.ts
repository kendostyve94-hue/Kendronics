import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';
import { PricingIntelligenceRepository } from './repositories/pricing-intelligence.repository';
import { SmartBufferService } from './smart-buffer.service';
import { JlcpcbPricingProvider } from './suppliers/jlcpcb-pricing.provider';
import { PcbWayPricingProvider } from './suppliers/pcbway-pricing.provider';
import { SupplierOrderService } from './suppliers/supplier-order.service';
import { SupplierPricingService } from './suppliers/supplier-pricing.service';

@Module({
  imports: [UploadsModule, NotificationsModule],
  controllers: [PricingController],
  providers: [PricingService, PricingRuleRepository, PricingIntelligenceRepository, SmartBufferService, JlcpcbPricingProvider, PcbWayPricingProvider, SupplierPricingService, SupplierOrderService],
  exports: [PricingService, PricingRuleRepository, PricingIntelligenceRepository, SmartBufferService, SupplierPricingService, SupplierOrderService],
})
export class PricingModule {}
