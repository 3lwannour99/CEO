export type MovementVelocity = "fast" | "medium" | "slow" | "unknown";

export type InventoryStatus =
  | "sold"
  | "inStock"
  | "notAvailable"
  | "reserve"
  | "reservationForCompanies"
  | "cession"
  | "contract"
  | "error"
  | "unknown"
  | "available"
  | "reserved"
  | "in-transit"
  | "service-hold";

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface CounterScreenSource {
  id: string;
  name: string;
  country: string;
  baseUrl: string;
}

export interface SourceError {
  sourceId: string;
  sourceName: string;
  message: string;
}

export interface ApiMeta {
  total: number;
  generatedAt: string;
  fromCache: boolean;
  sourceCount: number;
  successfulSources: number;
  failedSources: number;
  errors: SourceError[];
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ApiMeta;
}

export interface InventoryItem {
  absEntry: number | null;
  chassis: string;
  itemCode: string;
  model: string;
  itemGroupCode: number | null;
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
  price1: number | null;
  listNum1: number | null;
  listName1: string;
  price2: number | null;
  listNum2: number | null;
  listName2: string;
  price3: number | null;
  listNum3: number | null;
  listName3: string;
  price4: number | null;
  listNum4: number | null;
  listName4: string;
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
  chassisStatus: InventoryStatus | string;
  displayStatus: string;
  normalizedStatus: InventoryStatus | string;
  arInvoiceNo: string;
  cardCode: string;
  createDate: string;
  warehouse: string;
  bank: string;
  bankCode: string;
  contractDate: string;
  reserveDate: string;
  customerNumber: string;
  soRemarks: string;
  additionalRemark: string;
  sourceId: string;
  sourceName: string;
  sourceCountry: string;
  sourceBaseUrl: string;
  stockAgeDays: number | null;
  movementCategory: MovementVelocity;
  isSold: boolean;
  isReserved: boolean;
  isInStock: boolean;
  isReadyForSale: boolean;
  rawStatus: string;
}

export interface InventorySummary {
  totalUnits: number;
  currentStockUnits: number;
  soldUnits: number;
  reservedUnits: number;
  fastMovingUnits: number;
  mediumMovingUnits: number;
  slowMovingUnits: number;
  unknownAgeUnits: number;
  inTransitUnits: number;
  readyForSaleUnits: number;
  stockCoverageMonths: number | null;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    country: string;
    totalUnits: number;
    currentStockUnits: number;
  }>;
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
  location?: string;
  sourceName?: string;
  country?: string;
  branch?: string;
  warehouse?: string;
  brand?: string;
  model?: string;
  exteriorColor?: string;
  available?: number;
  reserved?: number;
  inTransit?: number;
  slowMoving?: number;
  currentStock?: number;
}

export interface SalesPerformanceItem {
  model: string;
  brand: string;
  unitsSold: number;
  revenue: number;
  margin?: string;
}

export interface LogisticsStatus {
  shipment?: string;
  poNo: string;
  status: string;
  eta?: string;
  estimatedArrival?: string;
  grpoDate?: string;
  apInvoiceDate?: string;
  units: number;
  branch: string;
  warehouse?: string;
  sourceName?: string;
}

export interface ReplenishmentSuggestion {
  brand: string;
  model: string;
  exteriorColor: string;
  currentStock: number;
  soldLast90Days: number;
  averageMonthlySales: number;
  suggestedOrderQuantity: number;
  reorderPoint: number;
}

export interface StockCoverageItem extends ReplenishmentSuggestion {
  coverageMonths: number | null;
  status: "danger" | "healthy" | "overstock" | "unknown";
}

export interface AggregatedStockItem {
  brand: string;
  model: string;
  exteriorColor: string;
  units: number;
}

export interface SalesPerformanceResponse {
  soldUnitsByModel: SalesPerformanceItem[];
  soldUnitsByBranch: Array<{ branch: string; unitsSold: number }>;
  soldUnitsBySource: Array<{ sourceId: string; sourceName: string; country: string; unitsSold: number }>;
  soldRevenue: number;
  customerGroupBreakdown: Array<{ customerGroup: string; unitsSold: number }>;
  topSellingModels: SalesPerformanceItem[];
  lowestSellingModels: SalesPerformanceItem[];
}

export interface DashboardSummary {
  metrics: {
    totalUnits: number;
    currentStockUnits: number;
    soldUnits: number;
    reservedUnits: number;
    fastMovingUnits: number;
    mediumMovingUnits: number;
    slowMovingUnits: number;
    inTransitUnits: number;
    readyForSaleUnits: number;
    stockCoverageMonths: number | null;
  };
  inventoryStatusSummary: {
    readyPercent: number;
    reservedUnits: number;
    serviceHoldUnits: number;
    averageCoverageMonths: number | null;
  };
  topSellingModels: SalesPerformanceItem[];
  slowStockList: InventoryItem[];
  recentAlerts: InventoryAlert[];
  stockByLocation: LocationStock[];
  salesPerformanceSnapshot: SalesPerformanceItem[];
  logisticsStatusSnapshot: LogisticsStatus[];
  meta: ApiMeta;
}

export interface InventoryFilters {
  sourceId?: string;
  brand?: string;
  model?: string;
  color?: string;
  branch?: string;
  warehouse?: string;
  status?: string;
  movementCategory?: string;
  ready?: string;
  search?: string;
  refresh?: boolean;
}

export interface PageFilterOption {
  label: string;
  value: string;
}
