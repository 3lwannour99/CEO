import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) {}

    @Get()
    findAll(@Query() query: InventoryQueryDto) {
        return this.logisticsService.findAll(query);
    }
}
