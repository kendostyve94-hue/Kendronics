import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens } from './entities/auth-tokens.entity';
import { SessionRepository } from './repositories/session.repository';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionRepository: SessionRepository,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.createUser(dto);
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.validateCredentials(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user.id, user.email);
  }

  async forgotPassword(_dto: ForgotPasswordDto): Promise<{ ok: true; message: string }> {
    return {
      ok: true,
      message: 'If an account can receive password reset email, we will send instructions shortly.',
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const session = await this.sessionRepository.findValidSession(dto.refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.sessionRepository.revoke(session.id);
    return this.issueTokens(session.userId, session.email);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const accessToken = this.authTokenService.createAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = this.authTokenService.createRefreshToken();
    await this.sessionRepository.create({ userId, email, refreshToken });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
