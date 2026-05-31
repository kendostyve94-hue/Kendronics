import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PricingModule } from '../pricing/pricing.module';
import { SupportModule } from '../support/support.module';
import { TrackingModule } from '../tracking/tracking.module';
import { UsersModule } from '../users/users.module';
import { CinetPayMobileMoneyProvider } from './providers/cinetpay-mobile-money.provider';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { PayDunyaMobileMoneyProvider } from './providers/paydunya-mobile-money.provider';
import { SimulatedMobileMoneyProvider } from './providers/simulated-mobile-money.provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PaymentAuthorizationMonitorService } from './payment-authorization-monitor.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentWebhookHandler } from './webhooks/payment-webhook.handler';

@Module({
  imports: [OrdersModule, TrackingModule, NotificationsModule, SupportModule, UsersModule, PricingModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    PaymentAuthorizationMonitorService,
    StripePaymentProvider,
    PaymentWebhookHandler,
    CinetPayMobileMoneyProvider,
    PayDunyaMobileMoneyProvider,
    SimulatedMobileMoneyProvider,
    {
      provide: MobileMoneyProvider,
      useFactory: (
        cinetPayProvider: CinetPayMobileMoneyProvider,
        payDunyaProvider: PayDunyaMobileMoneyProvider,
        simulatedProvider: SimulatedMobileMoneyProvider,
      ) => {
        if (process.env.MOBILE_MONEY_PROVIDER === 'cinetpay') {
          return cinetPayProvider;
        }
        if (process.env.MOBILE_MONEY_PROVIDER === 'paydunya') {
          return payDunyaProvider;
        }

        return simulatedProvider;
      },
      inject: [CinetPayMobileMoneyProvider, PayDunyaMobileMoneyProvider, SimulatedMobileMoneyProvider],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
