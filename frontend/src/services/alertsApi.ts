import { apiGet } from "@/lib/apiClient";
import type { InventoryAlert, InventoryFilters } from "@/types/inventory";

export function getAlerts(filters?: InventoryFilters) {
  return apiGet<InventoryAlert[]>("/alerts", filters);
}
