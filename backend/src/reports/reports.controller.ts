import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { ReportsService } from './reports.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('stock-coverage')
    @RequirePermissions('stockCoverage.view')
    getStockCoverage(@Query() query: InventoryQueryDto) {
        return this.reportsService.getStockCoverage(query);
    }

    @Get('sales-performance')
    @RequirePermissions('salesPerformance.view')
    getSalesPerformance(@Query() query: InventoryQueryDto) {
        return this.reportsService.getSalesPerformance(query);
    }

    @Get('aggregated-stock')
    @RequirePermissions('inventory.view')
    getAggregatedStock(@Query() query: InventoryQueryDto) {
        return this.reportsService.getAggregatedStock(query);
    }

    @Get('aggregated-stock/vins')
    @RequirePermissions('inventory.view')
    getVinReport(@Query() query: InventoryQueryDto) {
        return this.reportsService.getVinReport(query);
    }

    @Get('multi-location')
    @RequirePermissions('multiLocation.view')
    getMultiLocation(@Query() query: InventoryQueryDto) {
        return this.reportsService.getMultiLocation(query);
    }
}
