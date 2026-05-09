import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';

@Injectable()
export class DashboardService {
    constructor(private readonly inventoryService: InventoryService) {}

    async getSummary(query: InventoryQueryDto = {}) {
        const response = await this.inventoryService.findAll(query);
        const summary = await this.inventoryService.getSummary(query);
        const alerts = await this.inventoryService.getAlerts(query);
        const logistics = await this.inventoryService.getLogistics(query);
        const sales = await this.inventoryService.getSalesPerformance(query);
        const currentStock = response.data.filter((item) => item.isInStock);

        return {
            metrics: {
                totalRows: summary.totalRows,
                uniqueChassisCount: summary.uniqueChassisCount,
                multiStatusChassisCount: summary.multiStatusChassisCount,
                rowsInMultiStatusChassisGroups:
                    summary.rowsInMultiStatusChassisGroups,
                totalUnits: summary.totalUnits,
                currentStockUnits: summary.currentStockUnits,
                soldUnits: summary.soldUnits,
                reservedUnits: summary.reservedUnits,
                fastMovingUnits: summary.fastMovingUnits,
                mediumMovingUnits: summary.mediumMovingUnits,
                slowMovingUnits: summary.slowMovingUnits,
                inTransitUnits: summary.inTransitUnits,
                readyForSaleUnits: summary.readyForSaleUnits,
                stockCoverageMonths: summary.stockCoverageMonths,
            },
            inventoryStatusSummary: {
                readyPercent:
                    summary.currentStockUnits > 0
                        ? Math.round(
                              (summary.readyForSaleUnits /
                                  summary.currentStockUnits) *
                                  100,
                          )
                        : 0,
                reservedUnits: summary.reservedUnits,
                serviceHoldUnits: response.data.filter(
                    (item) => item.chassisStatus === 'service-hold',
                ).length,
                averageCoverageMonths: summary.stockCoverageMonths,
            },
            topSellingModels: sales.topSellingModels.slice(0, 5),
            slowStockList: currentStock
                .filter((item) => item.movementCategory === 'slow')
                .sort((a, b) => (b.stockAgeDays ?? 0) - (a.stockAgeDays ?? 0))
                .slice(0, 10),
            recentAlerts: alerts.slice(0, 10),
            stockByLocation: Object.values(
                currentStock.reduce<
                    Record<
                        string,
                        {
                            location: string;
                            available: number;
                            reserved: number;
                            inTransit: number;
                            slowMoving: number;
                        }
                    >
                >((groups, item) => {
                    const key = item.branch || item.sourceName || 'Unknown';
                    groups[key] = groups[key] ?? {
                        location: key,
                        available: 0,
                        reserved: 0,
                        inTransit: 0,
                        slowMoving: 0,
                    };
                    groups[key].available += item.quantity;
                    groups[key].reserved += item.isReserved ? item.quantity : 0;
                    groups[key].inTransit +=
                        item.estimatedArrival && !item.grpoDate
                            ? item.quantity
                            : 0;
                    groups[key].slowMoving +=
                        item.movementCategory === 'slow' ? item.quantity : 0;
                    return groups;
                }, {}),
            ),
            salesPerformanceSnapshot: sales.topSellingModels.slice(0, 5),
            logisticsStatusSnapshot: logistics.slice(0, 10),
            meta: response.meta,
        };
    }
}
