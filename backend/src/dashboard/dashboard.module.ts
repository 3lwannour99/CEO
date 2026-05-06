import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    controllers: [DashboardController],
    imports: [InventoryModule],
    providers: [DashboardService],
})
export class DashboardModule {}
