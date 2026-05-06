import { itemMatchesDateFilters } from "@/lib/dateFilters";
import type { InventoryFilters } from "@/types/filters";
import type { InventoryItem } from "@/types/inventory";

function matchesAny(value: string | boolean | null | undefined, selected: string[]) {
  if (selected.length === 0) {
    return true;
  }

  return selected.includes(String(value ?? ""));
}

function normalizeStatusValue(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z-]/g, "")
    .replace(/-/g, "");
}

function matchesStatus(item: InventoryItem, selected: string[]) {
  if (selected.length === 0) {
    return true;
  }

  const itemStatuses = [item.normalizedStatus, item.rawStatus, item.displayStatus, item.chassisStatus].map((value) => normalizeStatusValue(String(value ?? "")));
  return selected.some((status) => itemStatuses.includes(normalizeStatusValue(status)));
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
      matchesStatus(item, filters.statuses) &&
      matchesAny(item.movementCategory, filters.movementCategories) &&
      matchesAny(readyStatus, filters.readyStatuses) &&
      matchesAny(item.customerGroup, filters.customerGroups) &&
      matchesAny(item.salesMan, filters.salesmen) &&
      (!search || searchableText(item).includes(search)) &&
      itemMatchesDateFilters(item, filters)
    );
  });
}
