import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get()
    findAll(@Query() query: InventoryQueryDto) {
        return this.alertsService.findAll(query);
    }
}
