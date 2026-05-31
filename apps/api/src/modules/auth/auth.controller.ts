import { Body, Controller, Get, Headers, Post, Query, Redirect, Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { GoogleOAuthService } from './google-oauth.service';
import { LoginDto } from './dto/login.dto';
import { RequestProfileVerificationDto, VerifyProfileVerificationDto } from './dto/profile-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ProfileVerificationService } from './profile-verification.service';
import { UsersService } from '../users/users.service';
import { IsEmail, IsString, MinLength } from 'class-validator';

class RequestEmailChangeDto {
  @IsEmail()
  newEmail!: string;
}

class ConfirmEmailChangeDto extends RequestEmailChangeDto {
  @IsString()
  code!: string;
}

class ConfirmPasswordChangeDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(10)
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileVerificationService: ProfileVerificationService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: CookieResponse) {
    const tokens = await this.authService.register(dto);
    setAuthCookies(response, tokens);
    return tokens;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const tokens = await this.authService.login(dto);
    setAuthCookies(response, tokens);
    return tokens;
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Headers('cookie') cookieHeader: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const tokens = await this.authService.refresh({ refreshToken: dto.refreshToken ?? cookieValue(cookieHeader, refreshCookieName) });
    setAuthCookies(response, tokens);
    return tokens;
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto, @Headers('cookie') cookieHeader: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.authService.logout({ refreshToken: dto.refreshToken ?? cookieValue(cookieHeader, refreshCookieName) });
    clearAuthCookies(response);
    return result;
  }

  @Get('oauth/google/start')
  @Redirect()
  startGoogleOAuth() {
    return { url: this.googleOAuthService.createAuthorizationUrl() };
  }

  @Get('oauth/google/callback')
  @Redirect()
  async handleGoogleOAuthCallback(@Query('code') code: string | undefined, @Query('state') state: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const tokens = await this.googleOAuthService.handleCallback({ code, state });
    setAuthCookies(response, tokens);
    const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
    const redirectUrl = new URL('/login', frontendOrigin);
    redirectUrl.hash = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: String(tokens.expiresIn),
      authProvider: 'google',
    }).toString();
    return { url: redirectUrl.toString() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-verification/request')
  async requestProfileVerification(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestProfileVerificationDto) {
    const currentUser = await this.usersService.findById(user.id);
    return this.profileVerificationService.requestCode({
      userId: user.id,
      email: currentUser?.email ?? user.email,
      action: dto.action,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-verification/verify')
  verifyProfileVerification(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyProfileVerificationDto) {
    return this.profileVerificationService.verifyCode({
      userId: user.id,
      action: dto.action,
      code: dto.code,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-change/request')
  requestEmailChange(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestEmailChangeDto) {
    return this.authService.requestEmailChange(user.id, dto.newEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-change/confirm')
  confirmEmailChange(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(user.id, dto.newEmail, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password-change/request')
  requestPasswordChange(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.requestPasswordChange(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password-change/confirm')
  confirmPasswordChange(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmPasswordChangeDto) {
    return this.authService.confirmPasswordChange(user.id, dto.newPassword, dto.code);
  }
}

const accessCookieName = 'kendronics_access_token';
const refreshCookieName = 'kendronics_refresh_token';

type CookieTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  path: string;
  maxAge?: number;
};

type CookieResponse = {
  cookie: (name: string, value: string, options: CookieOptions) => void;
  clearCookie: (name: string, options: Omit<CookieOptions, 'maxAge'>) => void;
};

function setAuthCookies(response: CookieResponse, tokens: CookieTokens) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'none' : 'lax';
  response.cookie(accessCookieName, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: tokens.expiresIn * 1000,
  });
  response.cookie(refreshCookieName, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: Number(process.env.JWT_REFRESH_TOKEN_TTL_SECONDS ?? 30 * 24 * 60 * 60) * 1000,
  });
}

function clearAuthCookies(response: CookieResponse) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'none' : 'lax';
  response.clearCookie(accessCookieName, { httpOnly: true, secure, sameSite, path: '/' });
  response.clearCookie(refreshCookieName, { httpOnly: true, secure, sameSite, path: '/api/auth' });
}

function cookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .map((part) => {
      const separator = part.indexOf('=');
      return separator === -1 ? [part, ''] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
    })
    .find(([key]) => key === name)?.[1];
}
