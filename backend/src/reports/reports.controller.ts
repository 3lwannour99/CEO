import { Controller, Get, Query } from '@nestjs/common';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('stock-coverage')
    getStockCoverage(@Query() query: InventoryQueryDto) {
        return this.reportsService.getStockCoverage(query);
    }

    @Get('sales-performance')
    getSalesPerformance(@Query() query: InventoryQueryDto) {
        return this.reportsService.getSalesPerformance(query);
    }

    @Get('aggregated-stock')
    getAggregatedStock(@Query() query: InventoryQueryDto) {
        return this.reportsService.getAggregatedStock(query);
    }

    @Get('aggregated-stock/vins')
    getVinReport(@Query() query: InventoryQueryDto) {
        return this.reportsService.getVinReport(query);
    }

    @Get('multi-location')
    getMultiLocation(@Query() query: InventoryQueryDto) {
        return this.reportsService.getMultiLocation(query);
    }
}
