import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [OrdersModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
