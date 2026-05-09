import { Module } from '@nestjs/common';
import { CounterScreenModule } from '../integrations/counterscreen/counterscreen.module';
import { InventorySyncController } from './inventory-sync.controller';
import { InventorySyncScheduler } from './inventory-sync.scheduler';
import { InventorySyncService } from './inventory-sync.service';

@Module({
    controllers: [InventorySyncController],
    exports: [InventorySyncService],
    imports: [CounterScreenModule],
    providers: [InventorySyncScheduler, InventorySyncService],
})
export class InventorySyncModule {}
