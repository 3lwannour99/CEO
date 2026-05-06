import { Injectable } from '@nestjs/common';
import {
  alertsMock,
  inventoryMock,
  logisticsMock,
} from '../common/mock-data/inventory.mock';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class DashboardService {
  constructor(private readonly inventoryService: InventoryService) {}

  getSummary() {
    const summary = this.inventoryService.getSummary();

    return {
      metrics: {
        ...summary,
        stockCoverageMonths: 3.7,
      },
      sections: {
        inventoryStatusSummary: {
          readyPercent: 74,
          reservedUnits: summary.reserved,
          serviceHoldUnits: 24,
          averageCoverageMonths: 3.7,
        },
        topSellingModels: [
          { model: 'Corolla Hybrid', brand: 'Toyota', unitsSold: 52, revenue: 1279200 },
          { model: 'X5 xDrive40i', brand: 'BMW', unitsSold: 13, revenue: 889200 },
          { model: 'Kona', brand: 'Hyundai', unitsSold: 24, revenue: 513600 },
        ],
        slowStockList: inventoryMock.filter((item) => item.movementVelocity === 'slow'),
        recentAlerts: alertsMock,
        stockByLocation: [
          { location: 'Amman Main', available: 412, reserved: 38, inTransit: 61, slowMoving: 84 },
          { location: 'Sweifieh', available: 238, reserved: 27, inTransit: 34, slowMoving: 56 },
          { location: 'Irbid', available: 174, reserved: 16, inTransit: 22, slowMoving: 73 },
        ],
        salesPerformanceSnapshot: [
          { model: 'Corolla Hybrid', unitsSold: 52, margin: '14.6%' },
          { model: 'X5 xDrive40i', unitsSold: 13, margin: '11.2%' },
        ],
        logisticsStatusSnapshot: logisticsMock,
      },
    };
  }
}
