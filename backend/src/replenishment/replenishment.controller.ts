import { Controller, Get } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service';

@Controller('replenishment')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Get()
  findAll() {
    return this.replenishmentService.findAll();
  }
}
