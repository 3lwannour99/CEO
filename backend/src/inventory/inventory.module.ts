import { Module } from '@nestjs/common';
import { InventorySyncModule } from '../inventory-sync/inventory-sync.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    controllers: [InventoryController],
    imports: [InventorySyncModule],
    exports: [InventoryService],
    providers: [InventoryService],
})
export class InventoryModule {}
