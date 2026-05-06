import type { CounterScreenSource, InventoryItem, PageFilterOption } from "@/types/inventory";
import { OFFICIAL_VEHICLE_STATUSES } from "@/constants/statuses";

function uniqueOptions(items: InventoryItem[], selector: (item: InventoryItem) => string): PageFilterOption[] {
  return Array.from(new Set(items.map(selector).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
}

export function getFilterOptions(items: InventoryItem[], sources: CounterScreenSource[]) {
  return {
    sources: sources.map((source) => ({ label: source.name, value: source.id })),
    countries: uniqueOptions(items, (item) => item.sourceCountry),
    brands: uniqueOptions(items, (item) => item.brand),
    models: uniqueOptions(items, (item) => item.model),
    modelYears: uniqueOptions(items, (item) => item.modelYear),
    types: uniqueOptions(items, (item) => item.type),
    exteriorColors: uniqueOptions(items, (item) => item.exteriorColor),
    interiorColors: uniqueOptions(items, (item) => item.interiorColor),
    wheels: uniqueOptions(items, (item) => item.wheel),
    branches: uniqueOptions(items, (item) => item.branch),
    warehouses: uniqueOptions(items, (item) => item.warehouse),
    statuses: OFFICIAL_VEHICLE_STATUSES.map((status) => ({ label: status.rawValue, value: status.value })),
    movementCategories: [
      { label: "Fast", value: "fast" },
      { label: "Medium", value: "medium" },
      { label: "Slow", value: "slow" },
      { label: "Unknown", value: "unknown" },
    ],
    readyStatuses: [
      { label: "Ready", value: "ready" },
      { label: "Not Ready", value: "not-ready" },
    ],
    customerGroups: uniqueOptions(items, (item) => item.customerGroup),
    salesmen: uniqueOptions(items, (item) => item.salesMan),
  };
}
