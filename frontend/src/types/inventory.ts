import type { MoneyTotals } from "@/lib/currency";

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
  lastSyncedAt?: string | null;
  fromCache: boolean;
  fromDatabase?: boolean;
  syncStatus?: string;
  syncResult?: unknown;
  sourceCount: number;
  successfulSources: number;
  failedSources: number;
  errors: SourceError[];
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ApiMeta;
}

export interface InventoryUpdatedEvent {
  syncRunId: string;
  status: "success" | "partial_success" | "failed";
  lastSyncedAt: string;
  totalRows: number;
  totalRawRecords: number;
  totalNormalizedRecords: number;
  successfulSources: number;
  failedSources: number;
  sourceResults: Array<{
    sourceId: string;
    sourceName: string;
    status: "success" | "failed";
    recordsCount: number;
    errorMessage?: string;
  }>;
}

export interface InventoryLiveStatus {
  connected: boolean;
  lastEvent: InventoryUpdatedEvent | null;
  lastUpdatedAt: string | null;
  connectionError: string | null;
}

export type InventoryRefreshReason = "initial-load" | "websocket-update" | "manual-refresh" | "filter-change" | "visibility-return";

export interface InventoryItem {
  inventoryKey?: string;
  businessStateKey?: string;
  sourceRowIndex?: number | null;
  rowHash?: string | null;
  syncRunId?: string | null;
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
  recipientName: string;
  recipientNumber: string;
  uTanazol: string;
  uMobNum: string;
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
  totalRows: number;
  uniqueChassisCount: number;
  multiStatusChassisCount: number;
  rowsInMultiStatusChassisGroups: number;
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
  tone:
    | "neutral"
    | "positive"
    | "warning"
    | "danger"
    | "green"
    | "yellow"
    | "blue"
    | "purple"
    | "red"
    | "pink";
}

export interface InventoryAlert {
  id: string;
  type?:
    | "slowStock"
    | "lowStock"
    | "belowReorderPoint"
    | "coverageDanger"
    | "overstock"
    | "sourceFailure"
    | "oldReservation"
    | "unknownAge";
  title: string;
  message: string;
  severity: AlertSeverity;
  branch: string;
  sourceName?: string;
  model?: string;
  chassis?: string;
  status?: string;
  ageDays?: number | null;
  affectedCount?: number;
  sampleChassis?: string[];
  recommendedAction?: string;
  createdAt: string;
}

export interface LocationStock {
  sourceId?: string;
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

export interface RebalancingRecommendation {
  brand: string;
  model: string;
  exteriorColor: string;
  fromWarehouse: string;
  toWarehouse: string;
  fromSourceName?: string;
  toSourceName?: string;
  suggestedTransferQuantity: number;
}

export interface MultiLocationReport {
  stockByLocation: LocationStock[];
  transferTracking: unknown[];
  transferTrackingMessage: string;
  rebalancingRecommendations: RebalancingRecommendation[];
}

export interface SalesPerformanceItem {
  model: string;
  brand: string;
  type?: string;
  exteriorColor?: string;
  unitsSold: number;
  revenue: MoneyTotals;
  averageSoldPrice?: MoneyTotals;
  customerGroupBreakdown?: Array<{ customerGroup: string; unitsSold: number }>;
  branch?: string;
  sourceName?: string;
  sellThroughRate?: number;
  inventoryTurnover?: number;
  margin?: string;
}

export interface LogisticsStatus {
  shipment?: string;
  chassis?: string;
  poNo: string;
  status: string;
  eta?: string;
  estimatedArrival?: string;
  grpoDate?: string;
  apInvoiceDate?: string;
  orderDate?: string;
  cycleTimeDays?: number | null;
  supplierDelayDays?: number | null;
  isDelayed?: boolean;
  shippingCost?: number | null;
  units: number;
  branch: string;
  warehouse?: string;
  sourceName?: string;
}

export interface ReplenishmentSuggestion {
  brand: string;
  model: string;
  type?: string;
  exteriorColor: string;
  warehouse?: string;
  sourceId?: string;
  sourceName?: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  soldLast90Days: number;
  soldLast30Days: number;
  averageMonthlySales: number;
  leadTimeDays: number;
  leadTimeDemand: number;
  suggestedOrderQuantity: number;
  reorderPoint: number;
  targetCoverageMonths: number;
  urgency: "critical" | "high" | "medium" | "low";
  reason: string;
}

export interface StockCoverageItem extends ReplenishmentSuggestion {
  coverageMonths: number | null;
  status: "danger" | "healthy" | "overstock" | "noSalesData";
  recommendedAction: string;
}

export interface AggregatedStockItem {
  brand: string;
  model: string;
  type?: string;
  warehouse?: string;
  exteriorColor: string;
  units: number;
}

export interface AggregatedStockResponse {
  byTypeColor: AggregatedStockItem[];
  byModelColor: AggregatedStockItem[];
  byWarehouseTypeColor: AggregatedStockItem[];
}

export interface SlowStockSummaryItem {
  model: string;
  brand: string;
  type?: string;
  slowStockCount: number;
  averageStockAge: number | null;
  maxStockAge: number | null;
  warehouses: string[];
  branches: string[];
  sources: string[];
}

export interface InventoryMovementMatrixItem {
  model: string;
  brand: string;
  type: string;
  fastCount: number;
  mediumCount: number;
  slowCount: number;
  unknownCount: number;
  totalCount: number;
  slowPercentage: number;
  averageDaysInStock: number | null;
}

export interface SalesPerformanceResponse {
  soldUnitsByModel: SalesPerformanceItem[];
  soldUnitsByBranch: Array<{ branch: string; unitsSold: number }>;
  soldUnitsBySource: Array<{
    sourceId: string;
    sourceName: string;
    country: string;
    unitsSold: number;
  }>;
  soldRevenue: MoneyTotals;
  customerGroupBreakdown: Array<{ customerGroup: string; unitsSold: number }>;
  topSellingModels: SalesPerformanceItem[];
  lowestSellingModels: SalesPerformanceItem[];
  averageMovement: number;
  breakdownByModel: SalesPerformanceItem[];
  breakdownByType: Array<{ type: string; unitsSold: number }>;
  breakdownByColor: Array<{ exteriorColor: string; unitsSold: number }>;
  breakdownByModelColor?: SalesPerformanceItem[];
  bestSellingColors?: Array<{ exteriorColor: string; unitsSold: number; revenue: MoneyTotals }>;
  lowestSellingColors?: Array<{ exteriorColor: string; unitsSold: number; revenue: MoneyTotals }>;
  breakdownByBranch: Array<{ branch: string; unitsSold: number }>;
  breakdownByCountry: Array<{ country: string; unitsSold: number }>;
  sellThroughRate: number;
  inventoryTurnover: number;
}

export interface DashboardSummary {
  metrics: {
    totalRows: number;
    uniqueChassisCount: number;
    multiStatusChassisCount: number;
    rowsInMultiStatusChassisGroups: number;
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
    sellThroughRate?: number;
    inventoryTurnover?: number;
    alertCount?: number;
    urgentReplenishmentCount?: number;
    delayedLogisticsCount?: number;
  };
  inventoryStatusSummary: {
    readyPercent: number;
    reservedUnits: number;
    serviceHoldUnits: number;
    averageCoverageMonths: number | null;
  };
  topSellingModels: SalesPerformanceItem[];
  slowStockList: SlowStockSummaryItem[];
  recentAlerts: InventoryAlert[];
  stockByLocation: LocationStock[];
  salesPerformanceSnapshot: SalesPerformanceItem[];
  logisticsStatusSnapshot: LogisticsStatus[];
  bottomSellingModels?: SalesPerformanceItem[];
  meta: ApiMeta;
}

export interface StockRule {
  id: string;
  sourceId: string | null;
  brand: string | null;
  model: string | null;
  type: string | null;
  exteriorColor: string | null;
  warehouse: string | null;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  targetCoverageMonths: number;
  leadTimeDays: number;
  supplierName: string | null;
  factoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockRuleInput = Omit<StockRule, "id" | "createdAt" | "updatedAt">;

export interface InventorySnapshot {
  id: string;
  snapshotDate: string;
  sourceName: string | null;
  totalUnits: number;
  soldUnits: number;
  reservedUnits: number;
  inStockUnits: number;
  slowUnits: number;
  mediumUnits: number;
  fastUnits: number;
  totalValueSar: number;
  totalValueJod: number;
  totalValueUsd: number;
}

export interface MonthlyComparison {
  month: string;
  totalUnits: number;
  slowUnits: number;
  mediumUnits: number;
  fastUnits: number;
  soldUnits: number;
  reservedUnits: number;
  stockValueSar: number;
  stockValueJod: number;
  stockValueUsd: number;
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

export interface MultiStatusChassisGroup {
  sourceId: string;
  sourceName: string;
  chassis: string;
  rowCount: number;
  statuses: string[];
  rows: InventoryItem[];
}

export interface MultiStatusChassisResponse {
  data: MultiStatusChassisGroup[];
  meta: {
    totalGroups: number;
    totalRows: number;
    generatedAt: string;
    lastSyncedAt: string | null;
  };
}
