import { Module } from '@nestjs/common';
import { InventoryEventsGateway } from './inventory-events.gateway';
import { InventoryEventsService } from './inventory-events.service';

@Module({
    exports: [InventoryEventsService],
    providers: [InventoryEventsGateway, InventoryEventsService],
})
export class InventoryEventsModule {}
