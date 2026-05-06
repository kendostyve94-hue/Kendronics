import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';
import { SmartBufferService } from './smart-buffer.service';
import { JlcpcbPricingProvider } from './suppliers/jlcpcb-pricing.provider';
import { PcbWayPricingProvider } from './suppliers/pcbway-pricing.provider';
import { SupplierPricingService } from './suppliers/supplier-pricing.service';

@Module({
  imports: [UploadsModule],
  controllers: [PricingController],
  providers: [PricingService, PricingRuleRepository, SmartBufferService, JlcpcbPricingProvider, PcbWayPricingProvider, SupplierPricingService],
  exports: [PricingService, PricingRuleRepository, SmartBufferService, SupplierPricingService],
})
export class PricingModule {}
