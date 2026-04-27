import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PublicTrackingLookupDto } from './dto/public-tracking-lookup.dto';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  getTracking(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    return this.trackingService.getOrderTracking(user.id, orderId);
  }

  @Post('lookup')
  lookup(@Body() dto: PublicTrackingLookupDto) {
    return this.trackingService.lookupByOrderAndEmail(dto);
  }
}
