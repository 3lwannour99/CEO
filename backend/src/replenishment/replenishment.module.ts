import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ReplenishmentController } from './replenishment.controller';
import { ReplenishmentService } from './replenishment.service';

@Module({
    controllers: [ReplenishmentController],
    imports: [InventoryModule],
    providers: [ReplenishmentService],
})
export class ReplenishmentModule {}
