import { Module } from '@nestjs/common';
import { CounterScreenModule } from '../integrations/counterscreen/counterscreen.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    controllers: [InventoryController],
    imports: [CounterScreenModule],
    exports: [InventoryService],
    providers: [InventoryService],
})
export class InventoryModule {}
