import { Body, Controller, Headers, Post, Query } from '@nestjs/common';
import { MondayWebhookService } from './monday-webhook.service';

@Controller('monday')
export class MondayController {
  constructor(private readonly webhookService: MondayWebhookService) {}

  @Post('webhooks')
  webhook(
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: Record<string, unknown>,
  ) {
    return this.webhookService.handleWebhook({ body, headers, query });
  }
}
