import { Module } from '@nestjs/common';
import { CounterScreenModule } from '../integrations/counterscreen/counterscreen.module';
import { StockRulesModule } from '../stock-rules/stock-rules.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    controllers: [InventoryController],
    imports: [CounterScreenModule, StockRulesModule],
    exports: [InventoryService],
    providers: [InventoryService],
})
export class InventoryModule {}
