import { Module } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { UploadsModule } from '../uploads/uploads.module';
import { AccountDeletionFeedbackRepository } from './repositories/account-deletion-feedback.repository';
import { CookieConsentRepository } from './repositories/cookie-consent.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UploadsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, CookieConsentRepository, AccountDeletionFeedbackRepository, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
