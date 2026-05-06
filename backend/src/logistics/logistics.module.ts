import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

@Module({
    controllers: [LogisticsController],
    imports: [InventoryModule],
    providers: [LogisticsService],
})
export class LogisticsModule {}
