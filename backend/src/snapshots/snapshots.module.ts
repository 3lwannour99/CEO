import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';

@Module({
    controllers: [SnapshotsController],
    exports: [SnapshotsService],
    imports: [InventoryModule],
    providers: [SnapshotsService],
})
export class SnapshotsModule {}
