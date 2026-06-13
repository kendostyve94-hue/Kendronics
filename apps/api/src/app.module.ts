import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CountriesModule } from './modules/countries/countries.module';
import { ExplorerModule } from './modules/explorer/explorer.module';
import { HomeModule } from './modules/home/home.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MondayModule } from './modules/monday/monday.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { SupportModule } from './modules/support/support.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ExplorerModule,
    HomeModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    PricingModule,
    UploadsModule,
    PaymentsModule,
    TrackingModule,
    AdminModule,
    CountriesModule,
    LogisticsModule,
    SupportModule,
    NotificationsModule,
    MondayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
