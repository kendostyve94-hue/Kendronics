import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PricingRuleRepository],
  exports: [PricingService, PricingRuleRepository],
})
export class PricingModule {}
