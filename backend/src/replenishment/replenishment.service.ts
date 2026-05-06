import { Injectable } from '@nestjs/common';
import { replenishmentMock } from '../common/mock-data/inventory.mock';

@Injectable()
export class ReplenishmentService {
  findAll() {
    return replenishmentMock;
  }
}
