import { apiGet } from "@/lib/apiClient";
import type { DashboardSummary, InventoryFilters } from "@/types/inventory";

export function getDashboardSummary(filters?: InventoryFilters) {
  return apiGet<DashboardSummary>("/dashboard/summary", filters);
}
