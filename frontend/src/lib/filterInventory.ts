import { itemMatchesDateFilters } from "@/lib/dateFilters";
import type { InventoryFilters } from "@/types/filters";
import type { InventoryItem } from "@/types/inventory";

function matchesAny(value: string | boolean | null | undefined, selected: string[]) {
  if (selected.length === 0) {
    return true;
  }

  return selected.includes(String(value ?? ""));
}

function searchableText(item: InventoryItem) {
  return [
    item.chassis,
    item.itemCode,
    item.model,
    item.brand,
    item.exteriorColor,
    item.interiorColor,
    item.branch,
    item.warehouse,
    item.customerName,
    item.customerGroup,
    item.salesMan,
    item.poNo,
    item.arInvoiceNo,
    item.apInvoiceNo,
    item.customerNumber,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterInventory(items: InventoryItem[], filters: InventoryFilters): InventoryItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const status = item.isSold ? "sold" : item.isReserved ? "reserved" : item.isInStock ? "in-stock" : item.chassisStatus;
    const readyStatus = item.isReadyForSale ? "ready" : "not-ready";

    return (
      matchesAny(item.sourceId, filters.sourceIds) &&
      matchesAny(item.sourceCountry, filters.countries) &&
      matchesAny(item.brand, filters.brands) &&
      matchesAny(item.model, filters.models) &&
      matchesAny(item.modelYear, filters.modelYears) &&
      matchesAny(item.type, filters.types) &&
      matchesAny(item.exteriorColor, filters.exteriorColors) &&
      matchesAny(item.interiorColor, filters.interiorColors) &&
      matchesAny(item.wheel, filters.wheels) &&
      matchesAny(item.branch, filters.branches) &&
      matchesAny(item.warehouse, filters.warehouses) &&
      matchesAny(status, filters.statuses) &&
      matchesAny(item.movementCategory, filters.movementCategories) &&
      matchesAny(readyStatus, filters.readyStatuses) &&
      matchesAny(item.customerGroup, filters.customerGroups) &&
      matchesAny(item.salesMan, filters.salesmen) &&
      (!search || searchableText(item).includes(search)) &&
      itemMatchesDateFilters(item, filters)
    );
  });
}
