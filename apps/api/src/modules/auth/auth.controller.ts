import { Body, Controller, Get, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleOAuthService } from './google-oauth.service';
import { LoginDto } from './dto/login.dto';
import { RequestProfileVerificationDto, VerifyProfileVerificationDto } from './dto/profile-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ProfileVerificationService } from './profile-verification.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileVerificationService: ProfileVerificationService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @Get('oauth/google/start')
  @Redirect()
  startGoogleOAuth() {
    return { url: this.googleOAuthService.createAuthorizationUrl() };
  }

  @Get('oauth/google/callback')
  @Redirect()
  async handleGoogleOAuthCallback(@Query('code') code?: string, @Query('state') state?: string) {
    const tokens = await this.googleOAuthService.handleCallback({ code, state });
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
  requestProfileVerification(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestProfileVerificationDto) {
    return this.profileVerificationService.requestCode({
      userId: user.id,
      email: user.email,
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
}
