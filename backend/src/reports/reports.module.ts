import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    controllers: [ReportsController],
    imports: [InventoryModule],
    providers: [ReportsService],
})
export class ReportsModule {}
