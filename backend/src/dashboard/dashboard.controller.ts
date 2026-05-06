import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('summary')
    getSummary(@Query() query: InventoryQueryDto) {
        return this.dashboardService.getSummary(query);
    }
}
