import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionRepository } from './repositories/session.repository';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository],
  exports: [AuthService],
})
export class AuthModule {}
