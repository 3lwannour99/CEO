import { InventoryItemEntity } from '../../inventory/entities/inventory-item.entity';

export interface InventoryAlertMock {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  branch: string;
  createdAt: string;
}

export interface ReplenishmentSuggestionMock {
  model: string;
  brand: string;
  branch: string;
  currentStock: number;
  coverageMonths: number;
  suggestedOrder: number;
  priority: 'high' | 'medium' | 'low';
}

export interface LogisticsStatusMock {
  shipment: string;
  poNo: string;
  status: string;
  eta: string;
  units: number;
  branch: string;
}

export const inventoryMock: InventoryItemEntity[] = [
  {
    absEntry: 10021,
    chassis: 'JTDBR32E720145982',
    itemCode: 'TY-COR-2026-WHT',
    model: 'Corolla Hybrid',
    itemGroupCode: 101,
    type: 'Sedan',
    modelYear: '2026',
    exteriorColor: 'Pearl White',
    interiorColor: 'Black',
    wheel: '17 Alloy',
    notes: 'Ready for showroom display',
    quantity: 18,
    branch: 'Amman Main',
    ready: true,
    brand: 'Toyota',
    engineNo: '2ZR-8H9231',
    poNo: 'PO-2026-041',
    estimatedArrival: '2026-05-18',
    grpoDate: '2026-04-25',
    salesMan: 'Leen Haddad',
    arInvoiceDate: '2026-05-03',
    soldPrice: 24600,
    vat: 3936,
    customerName: 'Retail Walk-in',
    customerGroup: 'Retail',
    plateNumber: '29-44112',
    apInvoiceDate: '2026-04-21',
    apInvoiceNo: 'AP-77891',
    chassisStatus: 'available',
    arInvoiceNo: 'AR-50122',
    cardCode: 'C1009',
    createDate: '2026-04-12',
    warehouse: 'Main WH',
    reserveDate: '',
    movementVelocity: 'fast',
    coverageMonths: 1.8,
  },
  {
    absEntry: 10044,
    chassis: 'WBA5R1C01LFH82211',
    itemCode: 'BMW-X5-2025-BLK',
    model: 'X5 xDrive40i',
    itemGroupCode: 204,
    type: 'SUV',
    modelYear: '2025',
    exteriorColor: 'Carbon Black',
    interiorColor: 'Mocha',
    wheel: '20 Sport',
    notes: 'Reserved pending bank approval',
    quantity: 7,
    branch: 'Sweifieh',
    ready: true,
    brand: 'BMW',
    engineNo: 'B58-22601',
    poNo: 'PO-2026-029',
    estimatedArrival: '2026-05-25',
    grpoDate: '2026-03-14',
    salesMan: 'Omar Qasem',
    arInvoiceDate: '',
    soldPrice: 68400,
    vat: 10944,
    customerName: 'Al Noor Leasing',
    customerGroup: 'Fleet',
    plateNumber: '',
    apInvoiceDate: '2026-03-11',
    apInvoiceNo: 'AP-77210',
    chassisStatus: 'reserved',
    arInvoiceNo: '',
    cardCode: 'C2041',
    createDate: '2026-03-10',
    warehouse: 'Premium WH',
    reserveDate: '2026-05-02',
    movementVelocity: 'medium',
    coverageMonths: 3.4,
  },
  {
    absEntry: 10067,
    chassis: 'KM8K12AA5NU901236',
    itemCode: 'HY-KON-2024-RED',
    model: 'Kona',
    itemGroupCode: 118,
    type: 'Crossover',
    modelYear: '2024',
    exteriorColor: 'Pulse Red',
    interiorColor: 'Gray',
    wheel: '16 Alloy',
    notes: 'Ageing stock review required',
    quantity: 24,
    branch: 'Irbid',
    ready: false,
    brand: 'Hyundai',
    engineNo: 'G4FL-99012',
    poNo: 'PO-2025-188',
    estimatedArrival: '2026-05-10',
    grpoDate: '2025-12-08',
    salesMan: 'Maya Nasser',
    arInvoiceDate: '',
    soldPrice: 21400,
    vat: 3424,
    customerName: '',
    customerGroup: '',
    plateNumber: '',
    apInvoiceDate: '2025-12-03',
    apInvoiceNo: 'AP-74118',
    chassisStatus: 'service-hold',
    arInvoiceNo: '',
    cardCode: '',
    createDate: '2025-12-01',
    warehouse: 'North WH',
    reserveDate: '',
    movementVelocity: 'slow',
    coverageMonths: 7.2,
  },
  {
    absEntry: 10092,
    chassis: 'SALWA2BU8PA113901',
    itemCode: 'LR-RRS-2026-GRY',
    model: 'Range Rover Sport',
    itemGroupCode: 304,
    type: 'Luxury SUV',
    modelYear: '2026',
    exteriorColor: 'Eiger Grey',
    interiorColor: 'Ebony',
    wheel: '21 Diamond',
    notes: 'At port clearance',
    quantity: 5,
    branch: 'Amman Main',
    ready: false,
    brand: 'Land Rover',
    engineNo: 'P400-44190',
    poNo: 'PO-2026-055',
    estimatedArrival: '2026-05-20',
    grpoDate: '',
    salesMan: 'Kareem Saleh',
    arInvoiceDate: '',
    soldPrice: 98200,
    vat: 15712,
    customerName: '',
    customerGroup: '',
    plateNumber: '',
    apInvoiceDate: '',
    apInvoiceNo: '',
    chassisStatus: 'in-transit',
    arInvoiceNo: '',
    cardCode: '',
    createDate: '2026-04-28',
    warehouse: 'Port',
    reserveDate: '',
    movementVelocity: 'medium',
    coverageMonths: 2.9,
  },
];

export const alertsMock: InventoryAlertMock[] = [
  {
    id: 'ALT-1001',
    title: 'Slow stock threshold exceeded',
    message: 'Kona 2024 in Irbid has crossed the ageing threshold.',
    severity: 'warning',
    branch: 'Irbid',
    createdAt: '2026-05-06 09:10',
  },
  {
    id: 'ALT-1002',
    title: 'Low coverage on Corolla Hybrid',
    message: 'Fast moving sedan coverage is below two months.',
    severity: 'critical',
    branch: 'Amman Main',
    createdAt: '2026-05-06 08:45',
  },
  {
    id: 'ALT-1003',
    title: 'Port arrival updated',
    message: 'Range Rover Sport shipment ETA moved to May 20.',
    severity: 'info',
    branch: 'Amman Main',
    createdAt: '2026-05-05 16:30',
  },
];

export const replenishmentMock: ReplenishmentSuggestionMock[] = [
  {
    model: 'Corolla Hybrid',
    brand: 'Toyota',
    branch: 'Amman Main',
    currentStock: 18,
    coverageMonths: 1.8,
    suggestedOrder: 45,
    priority: 'high',
  },
  {
    model: 'X5 xDrive40i',
    brand: 'BMW',
    branch: 'Sweifieh',
    currentStock: 7,
    coverageMonths: 3.4,
    suggestedOrder: 8,
    priority: 'medium',
  },
  {
    model: 'Kona',
    brand: 'Hyundai',
    branch: 'Irbid',
    currentStock: 24,
    coverageMonths: 7.2,
    suggestedOrder: 0,
    priority: 'low',
  },
];

export const logisticsMock: LogisticsStatusMock[] = [
  {
    shipment: 'Ocean Freight 224A',
    poNo: 'PO-2026-055',
    status: 'Port clearance',
    eta: '2026-05-20',
    units: 18,
    branch: 'Amman Main',
  },
  {
    shipment: 'Carrier Batch 18',
    poNo: 'PO-2026-041',
    status: 'Inland transfer',
    eta: '2026-05-18',
    units: 42,
    branch: 'Amman Main',
  },
  {
    shipment: 'Regional Shuttle 07',
    poNo: 'PO-2026-062',
    status: 'Scheduled',
    eta: '2026-05-22',
    units: 12,
    branch: 'Irbid',
  },
];
