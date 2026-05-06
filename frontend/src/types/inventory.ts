export type MovementVelocity = "fast" | "medium" | "slow";

export type InventoryStatus =
  | "available"
  | "reserved"
  | "sold"
  | "in-transit"
  | "service-hold";

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface InventoryItem {
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

export interface DashboardMetric {
  label: string;
  value: string;
  trend: string;
  tone: "neutral" | "positive" | "warning" | "danger";
}

export interface InventoryAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  branch: string;
  createdAt: string;
}

export interface LocationStock {
  location: string;
  available: number;
  reserved: number;
  inTransit: number;
  slowMoving: number;
}

export interface SalesPerformanceItem {
  model: string;
  brand: string;
  unitsSold: number;
  revenue: number;
  margin: string;
}

export interface LogisticsStatus {
  shipment: string;
  poNo: string;
  status: string;
  eta: string;
  units: number;
  branch: string;
}

export interface PageFilterOption {
  label: string;
  value: string;
}
