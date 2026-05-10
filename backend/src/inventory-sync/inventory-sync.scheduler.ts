import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
    getInventoryDataMode,
    isInventorySyncEnabled,
} from '../inventory/inventory-data-mode';
import { InventorySyncService } from './inventory-sync.service';

@Injectable()
export class InventorySyncScheduler {
    private readonly logger = new Logger(InventorySyncScheduler.name);

    constructor(private readonly inventorySyncService: InventorySyncService) {}

    @Cron(process.env.INVENTORY_SYNC_INTERVAL_CRON ?? '*/1 * * * *')
    async handleCron() {
        const mode = getInventoryDataMode();
        if (mode === 'live') {
            this.logger.log(
                'Inventory sync disabled because INVENTORY_DATA_MODE=live',
            );
            return;
        }

        if (!isInventorySyncEnabled()) {
            this.logger.log(
                'Inventory sync disabled by INVENTORY_SYNC_ENABLED=false',
            );
            return;
        }

        const result = await this.inventorySyncService.runSync('scheduled');
        if ('skipped' in result && result.skipped) {
            this.logger.warn(
                'Inventory sync skipped because another sync is running.',
            );
        }
    }
}
