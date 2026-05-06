import { Injectable } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class LogisticsService {
    constructor(private readonly inventoryService: InventoryService) {}

    findAll(query: InventoryQueryDto = {}) {
        return this.inventoryService.getLogistics(query);
    }
}
