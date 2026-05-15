import { Body, Controller, Delete, Get, HttpCode, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UpsertCookieConsentDto } from './dto/cookie-consent.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
