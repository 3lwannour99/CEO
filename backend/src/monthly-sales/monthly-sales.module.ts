import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { MonthlySalesController } from './monthly-sales.controller';
import { MonthlySalesService } from './monthly-sales.service';

@Module({
    controllers: [MonthlySalesController],
    imports: [InventoryModule],
    providers: [MonthlySalesService],
})
export class MonthlySalesModule {}
