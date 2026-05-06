import { Injectable } from '@nestjs/common';
import { alertsMock } from '../common/mock-data/inventory.mock';

@Injectable()
export class AlertsService {
  findAll() {
    return alertsMock;
  }
}
