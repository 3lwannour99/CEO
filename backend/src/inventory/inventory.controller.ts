import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }
}
