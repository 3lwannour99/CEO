import { Injectable } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ReportsService {
    constructor(private readonly inventoryService: InventoryService) {}

    getStockCoverage(query: InventoryQueryDto) {
        return this.inventoryService.getStockCoverage(query);
    }

    getSalesPerformance(query: InventoryQueryDto) {
        return this.inventoryService.getSalesPerformance(query);
    }

    getAggregatedStock(query: InventoryQueryDto) {
        return this.inventoryService.getAggregatedStock(query);
    }

    async getVinReport(query: InventoryQueryDto) {
        return (await this.inventoryService.findAll(query)).data;
    }

    getMultiLocation(query: InventoryQueryDto) {
        return this.inventoryService.getMultiLocation(query);
    }
}
