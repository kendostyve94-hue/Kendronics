import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionRepository } from './repositories/session.repository';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, SessionRepository],
  exports: [AuthService, AuthTokenService],
})
export class AuthModule {}
