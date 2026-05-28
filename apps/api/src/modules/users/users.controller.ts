import { Body, Controller, Delete, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ProfileVerificationService } from '../auth/profile-verification.service';
import { AccountDeletionFeedbackDto } from './dto/account-deletion-feedback.dto';
import { UpsertCookieConsentDto } from './dto/cookie-consent.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateAccountAddressDto, UpdateAccountProfileDto } from './dto/update-account-settings.dto';
import { UsersService } from './users.service';
import { VerificationLevelService } from './verification-level.service';

class StartPhoneVerificationDto {
  @IsString()
  phone!: string;
}

class CheckPhoneVerificationDto extends StartPhoneVerificationDto {
  @IsString()
  code!: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileVerificationService: ProfileVerificationService,
    private readonly verificationLevelService: VerificationLevelService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Put('me/profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAccountProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('me/shipping-address')
  updateShippingAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAccountAddressDto) {
    return this.usersService.updateAddress(user.id, 'shippingAddress', dto);
  }

  @Put('me/billing-address')
  updateBillingAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAccountAddressDto) {
    return this.usersService.updateAddress(user.id, 'billingAddress', dto);
  }

  @Get('me/cookie-consent')
  cookieConsent(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findCookieConsent(user.id);
  }

  @Put('me/cookie-consent')
  updateCookieConsent(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertCookieConsentDto) {
    return this.usersService.upsertCookieConsent(user.id, dto);
  }

  @Get('me/verification-status')
  verificationStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.verificationLevelService.getStatus(user.id);
  }

  @Get('me/risk-profile')
  riskProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.verificationLevelService.getStatus(user.id);
  }

  @Post('me/phone-verification/start')
  startPhoneVerification(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartPhoneVerificationDto) {
    return this.usersService.startPhoneVerification(user.id, dto.phone);
  }

  @Post('me/phone-verification/check')
  checkPhoneVerification(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckPhoneVerificationDto) {
    return this.usersService.checkPhoneVerification(user.id, dto.phone, dto.code);
  }

  @Post('me/account-deletion-feedback')
  createAccountDeletionFeedback(@CurrentUser() user: AuthenticatedUser, @Body() dto: AccountDeletionFeedbackDto) {
    return this.usersService.createAccountDeletionFeedback(user, dto);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: DeleteAccountDto) {
    await this.profileVerificationService.verifyCode({
      userId: user.id,
      action: 'delete',
      code: dto.code,
    });
    return this.usersService.deleteAccount(user.id);
  }
}
