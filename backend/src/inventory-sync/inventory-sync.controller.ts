import { Controller, Get, Post } from '@nestjs/common';
import { InventorySyncService } from './inventory-sync.service';

@Controller('inventory-sync')
export class InventorySyncController {
    constructor(private readonly inventorySyncService: InventorySyncService) {}

    @Post('run')
    run() {
        return this.inventorySyncService.runSync('manual');
    }

    @Get('status')
    getStatus() {
        return this.inventorySyncService.getStatus();
    }

    @Get('runs')
    getRuns() {
        return this.inventorySyncService.getRuns();
    }
}
