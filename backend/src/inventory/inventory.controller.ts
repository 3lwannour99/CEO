import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    @Get()
    @RequirePermissions('inventory.page.view')
    findAll(@Query() query: InventoryQueryDto) {
        return this.inventoryService.findAll(query);
    }

    @Get('raw')
    @RequirePermissions('inventory.page.view')
    findRaw(@Query() query: InventoryQueryDto) {
        return this.inventoryService.findRaw(query);
    }

    @Get('summary')
    @RequirePermissions('inventory.page.view')
    getSummary(@Query() query: InventoryQueryDto) {
        return this.inventoryService.getSummary(query);
    }

    @Get('multi-status-chassis')
    @RequirePermissions('inventory.page.view')
    getMultiStatusChassis(@Query() query: InventoryQueryDto) {
        return this.inventoryService.getMultiStatusChassis(query);
    }
}
