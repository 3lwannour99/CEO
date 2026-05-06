export type MovementVelocity = 'fast' | 'medium' | 'slow';

export type InventoryStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'in-transit'
  | 'service-hold';

export class InventoryItemEntity {
  absEntry: number;
  chassis: string;
  itemCode: string;
  model: string;
  itemGroupCode: number;
  type: string;
  modelYear: string;
  exteriorColor: string;
  interiorColor: string;
  wheel: string;
  notes: string;
  quantity: number;
  branch: string;
  ready: boolean;
  brand: string;
  engineNo: string;
  poNo: string;
  estimatedArrival: string;
  grpoDate: string;
  salesMan: string;
  arInvoiceDate: string;
  soldPrice: number;
  vat: number;
  customerName: string;
  customerGroup: string;
  plateNumber: string;
  apInvoiceDate: string;
  apInvoiceNo: string;
  chassisStatus: InventoryStatus;
  arInvoiceNo: string;
  cardCode: string;
  createDate: string;
  warehouse: string;
  reserveDate: string;
  movementVelocity: MovementVelocity;
  coverageMonths: number;
}
