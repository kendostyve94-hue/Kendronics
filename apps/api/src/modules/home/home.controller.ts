import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('recent-production')
  recentProduction(@Query('limit') limit?: string) {
    return this.homeService.recentProduction(Number(limit ?? 6));
  }
}
