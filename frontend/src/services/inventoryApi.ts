import { apiGet } from "@/lib/apiClient";
import type {
  AggregatedStockItem,
  ApiListResponse,
  CounterScreenSource,
  InventoryFilters,
  InventoryItem,
  InventorySummary,
  LocationStock,
  SalesPerformanceResponse,
  StockCoverageItem,
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

export function getSalesPerformance(filters?: InventoryFilters) {
  return apiGet<SalesPerformanceResponse>("/sales-performance", filters);
}

export function getAggregatedStock(filters?: InventoryFilters) {
  return apiGet<AggregatedStockItem[]>("/aggregated-stock", filters);
}

export function getMultiLocation(filters?: InventoryFilters) {
  return apiGet<LocationStock[]>("/multi-location", filters);
}
