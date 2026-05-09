import { Module } from '@nestjs/common';
import { InventorySyncModule } from '../inventory-sync/inventory-sync.module';
import { StockRulesModule } from '../stock-rules/stock-rules.module';
import { CounterScreenModule } from '../integrations/counterscreen/counterscreen.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    controllers: [InventoryController],
    imports: [CounterScreenModule, InventorySyncModule, StockRulesModule],
    exports: [InventoryService],
    providers: [InventoryService],
})
export class InventoryModule {}
