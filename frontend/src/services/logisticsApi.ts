import { apiGet } from "@/lib/apiClient";
import type { InventoryFilters, LogisticsStatus } from "@/types/inventory";

export function getLogistics(filters?: InventoryFilters) {
  return apiGet<LogisticsStatus[]>("/logistics", filters);
}
