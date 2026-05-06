import { Injectable } from '@nestjs/common';
import { inventoryMock } from '../common/mock-data/inventory.mock';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryItemEntity } from './entities/inventory-item.entity';

export interface InventorySummary {
  totalStock: number;
  fastMoving: number;
  mediumMoving: number;
  slowMoving: number;
  reserved: number;
  soldThisMonth: number;
  inTransit: number;
}

@Injectable()
export class InventoryService {
  findAll(query: InventoryQueryDto): InventoryItemEntity[] {
    return inventoryMock.filter((item) => {
      const matchesBrand = !query.brand || item.brand.toLowerCase() === query.brand.toLowerCase();
      const matchesModel = !query.model || item.model.toLowerCase().includes(query.model.toLowerCase());
      const matchesColor =
        !query.color || item.exteriorColor.toLowerCase().includes(query.color.toLowerCase());
      const matchesBranch = !query.branch || item.branch.toLowerCase() === query.branch.toLowerCase();
      const matchesWarehouse =
        !query.warehouse || item.warehouse.toLowerCase() === query.warehouse.toLowerCase();
      const matchesStatus =
        !query.status || item.chassisStatus.toLowerCase() === query.status.toLowerCase();

      return (
        matchesBrand &&
        matchesModel &&
        matchesColor &&
        matchesBranch &&
        matchesWarehouse &&
        matchesStatus
      );
    });
  }

  getSummary(): InventorySummary {
    return {
      totalStock: 1284,
      fastMoving: 462,
      mediumMoving: 517,
      slowMoving: 305,
      reserved: 96,
      soldThisMonth: 188,
      inTransit: 143,
    };
  }
}
