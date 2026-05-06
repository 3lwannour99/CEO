import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
    controllers: [AlertsController],
    imports: [InventoryModule],
    providers: [AlertsService],
})
export class AlertsModule {}
