import { Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { IdentityVerificationService } from './identity-verification.service';

@Controller()
export class IdentityVerificationController {
  constructor(private readonly identityVerificationService: IdentityVerificationService) {}

  @Post('verification/identity/start')
  @UseGuards(JwtAuthGuard)
  start(@CurrentUser() user: AuthenticatedUser) {
    return this.identityVerificationService.start(user.id);
  }

  @Get('verification/identity/status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.identityVerificationService.status(user.id);
  }

  @Post('webhooks/stripe-identity')
  webhook(@Headers('stripe-signature') signature: string, @Req() request: { body: unknown; rawBody?: Buffer }) {
    return this.identityVerificationService.handleWebhook(signature, request.rawBody, request.body);
  }
}
