import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';
import { SmartBufferService } from './smart-buffer.service';

@Module({
  imports: [UploadsModule],
  controllers: [PricingController],
  providers: [PricingService, PricingRuleRepository, SmartBufferService],
  exports: [PricingService, PricingRuleRepository, SmartBufferService],
})
export class PricingModule {}
