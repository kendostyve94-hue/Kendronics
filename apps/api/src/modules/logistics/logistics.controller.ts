import { Controller, Get, Query } from '@nestjs/common';
import { DeliveryEstimateQueryDto } from './dto/delivery-estimate-query.dto';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('zones')
  listZones() {
    return this.logisticsService.listZones();
  }

  @Get('delivery-estimate')
  getDeliveryEstimate(@Query() query: DeliveryEstimateQueryDto) {
    return this.logisticsService.getDeliveryEstimate(query.countryIso2, query.shippingMode);
  }
}
