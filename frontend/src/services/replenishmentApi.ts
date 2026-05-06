import { apiGet } from "@/lib/apiClient";
import type { InventoryFilters, ReplenishmentSuggestion } from "@/types/inventory";

export function getReplenishment(filters?: InventoryFilters) {
  return apiGet<ReplenishmentSuggestion[]>("/replenishment", filters);
}
