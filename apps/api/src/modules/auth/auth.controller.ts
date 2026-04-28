import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
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
