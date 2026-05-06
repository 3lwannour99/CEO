import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController],
  exports: [InventoryService],
  providers: [InventoryService],
})
export class InventoryModule {}
