import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventorySyncService } from './inventory-sync.service';

@Injectable()
export class InventorySyncScheduler {
    private readonly logger = new Logger(InventorySyncScheduler.name);

    constructor(private readonly inventorySyncService: InventorySyncService) {}

    @Cron(process.env.INVENTORY_SYNC_INTERVAL_CRON ?? '*/1 * * * *')
    async handleCron() {
        if (process.env.INVENTORY_SYNC_ENABLED === 'false') {
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
