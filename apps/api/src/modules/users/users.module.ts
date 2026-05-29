import { Module } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupportModule } from '../support/support.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AccountDeletionFeedbackRepository } from './repositories/account-deletion-feedback.repository';
import { CookieConsentRepository } from './repositories/cookie-consent.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { VerificationLevelService } from './verification-level.service';

@Module({
  imports: [UploadsModule, NotificationsModule, SupportModule],
  controllers: [UsersController],
  providers: [UsersService, VerificationLevelService, UsersRepository, CookieConsentRepository, AccountDeletionFeedbackRepository, PasswordService],
  exports: [UsersService, VerificationLevelService],
})
export class UsersModule {}
