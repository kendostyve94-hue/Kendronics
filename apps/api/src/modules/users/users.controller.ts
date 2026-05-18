import { Body, Controller, Delete, Get, HttpCode, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ProfileVerificationService } from '../auth/profile-verification.service';
import { UpsertCookieConsentDto } from './dto/cookie-consent.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileVerificationService: ProfileVerificationService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Get('me/cookie-consent')
  cookieConsent(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findCookieConsent(user.id);
  }

  @Put('me/cookie-consent')
  updateCookieConsent(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertCookieConsentDto) {
    return this.usersService.upsertCookieConsent(user.id, dto);
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
