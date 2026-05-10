import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get()
    @RequirePermissions('alerts.page.view')
    findAll(@Query() query: InventoryQueryDto) {
        return this.alertsService.findAll(query);
    }
}
