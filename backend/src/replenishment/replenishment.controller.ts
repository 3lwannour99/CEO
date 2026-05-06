import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { ReplenishmentService } from './replenishment.service';

@Controller('replenishment')
export class ReplenishmentController {
    constructor(private readonly replenishmentService: ReplenishmentService) {}

    @Get()
    findAll(@Query() query: InventoryQueryDto) {
        return this.replenishmentService.findAll(query);
    }
}
