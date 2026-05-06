import { Controller, Get } from '@nestjs/common';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  findAll() {
    return this.logisticsService.findAll();
  }
}
