import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) {}

    @Get()
    @RequirePermissions('logistics.page.view')
    findAll(@Query() query: InventoryQueryDto) {
        return this.logisticsService.findAll(query);
    }
}
