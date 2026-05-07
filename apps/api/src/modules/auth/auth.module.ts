import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupportModule } from '../support/support.module';
import { UsersModule } from '../users/users.module';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { OAuthStateService } from './oauth-state.service';
import { ProfileVerificationService } from './profile-verification.service';
import { SessionRepository } from './repositories/session.repository';

@Global()
@Module({
  imports: [PrismaModule, UsersModule, SupportModule],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, SessionRepository, ProfileVerificationService, OAuthStateService, GoogleOAuthService],
  exports: [AuthService, AuthTokenService, ProfileVerificationService],
})
export class AuthModule {}
