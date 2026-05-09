import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";
import type {
  AggregatedStockItem,
  AggregatedStockResponse,
  ApiListResponse,
  CounterScreenSource,
  InventoryFilters,
  InventoryItem,
  InventorySummary,
  LocationStock,
  MonthlyComparison,
  MultiLocationReport,
  SalesPerformanceResponse,
  StockRule,
  StockRuleInput,
  InventorySnapshot,
  StockCoverageItem,
  MultiStatusChassisResponse,
} from "@/types/inventory";

export function getSources() {
  return apiGet<CounterScreenSource[]>("/sources");
}

export function getInventory(filters?: InventoryFilters) {
  return apiGet<ApiListResponse<InventoryItem>>("/inventory", filters);
}

export function getInventorySummary(filters?: InventoryFilters) {
  return apiGet<InventorySummary>("/inventory/summary", filters);
}

export function getStockCoverage(filters?: InventoryFilters) {
  return apiGet<StockCoverageItem[]>("/stock-coverage", filters);
}

export function getMultiStatusChassis(filters?: InventoryFilters) {
  return apiGet<MultiStatusChassisResponse>("/inventory/multi-status-chassis", filters);
}

export function getRawInventory(filters?: InventoryFilters) {
  return apiGet<unknown>("/inventory/raw", filters);
}

export function getSalesPerformance(filters?: InventoryFilters) {
  return apiGet<SalesPerformanceResponse>("/sales-performance", filters);
}

export function getAggregatedStock(filters?: InventoryFilters) {
  return apiGet<AggregatedStockResponse | AggregatedStockItem[]>("/aggregated-stock", filters);
}

export function getMultiLocation(filters?: InventoryFilters) {
  return apiGet<MultiLocationReport | LocationStock[]>("/multi-location", filters);
}

export function getStockRules() {
  return apiGet<StockRule[]>("/stock-rules");
}

export function createStockRule(rule: StockRuleInput) {
  return apiPost<StockRule>("/stock-rules", rule);
}

export function updateStockRule(id: string, rule: StockRuleInput) {
  return apiPut<StockRule>(`/stock-rules/${id}`, rule);
}

export function deleteStockRule(id: string) {
  return apiDelete<StockRule>(`/stock-rules/${id}`);
}

export function getSnapshots() {
  return apiGet<InventorySnapshot[]>("/snapshots");
}

export function runSnapshot() {
  return apiPost<InventorySnapshot>("/snapshots/run");
}

export function getMonthlyComparison() {
  return apiGet<MonthlyComparison[]>("/snapshots/monthly-comparison");
}
