import { Injectable } from '@nestjs/common';
import { logisticsMock } from '../common/mock-data/inventory.mock';

@Injectable()
export class LogisticsService {
  findAll() {
    return logisticsMock;
  }
}
