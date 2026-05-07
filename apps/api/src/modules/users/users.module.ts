import { Module } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { CookieConsentRepository } from './repositories/cookie-consent.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, CookieConsentRepository, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
