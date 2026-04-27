import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { TrackingController } from './tracking.controller';
import { TrackingRepository } from './repositories/tracking.repository';
import { TrackingService } from './tracking.service';

@Module({
  imports: [OrdersModule, UsersModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingRepository],
  exports: [TrackingService],
})
export class TrackingModule {}
