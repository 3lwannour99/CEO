import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventorySyncService } from './inventory-sync.service';

@Controller('inventory-sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventorySyncController {
    constructor(private readonly inventorySyncService: InventorySyncService) {}

    @Post('run')
    @RequirePermissions('actions.syncInventory.execute')
    run() {
        return this.inventorySyncService.runSync('manual');
    }

    @Get('status')
    @RequirePermissions('inventory.page.view')
    getStatus() {
        return this.inventorySyncService.getStatus();
    }

    @Get('runs')
    @RequirePermissions('inventory.page.view')
    getRuns() {
        return this.inventorySyncService.getRuns();
    }
}
