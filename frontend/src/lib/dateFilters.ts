import type { DateField, DatePreset, InventoryFilters } from "@/types/filters";
import type { InventoryItem } from "@/types/inventory";

export const dateFields: Array<{ value: DateField; key: string }> = [
  { value: "all", key: "filters.allRelevantDates" },
  { value: "grpoDate", key: "table.grpoDate" },
  { value: "arInvoiceDate", key: "filters.arInvoiceDate" },
  { value: "apInvoiceDate", key: "filters.apInvoiceDate" },
  { value: "createDate", key: "filters.createDate" },
  { value: "contractDate", key: "filters.contractDate" },
  { value: "reserveDate", key: "filters.reserveDate" },
  { value: "estimatedArrival", key: "filters.estimatedArrivalDate" },
];

export const datePresets: Array<{ value: DatePreset; key: string }> = [
  { value: "", key: "filters.noPreset" },
  { value: "today", key: "filters.today" },
  { value: "yesterday", key: "filters.yesterday" },
  { value: "last7Days", key: "filters.last7Days" },
  { value: "last30Days", key: "filters.last30Days" },
  { value: "thisMonth", key: "filters.thisMonth" },
  { value: "lastMonth", key: "filters.lastMonth" },
  { value: "thisYear", key: "filters.thisYear" },
];

const relevantDateFields: Exclude<DateField, "all">[] = [
  "grpoDate",
  "arInvoiceDate",
  "apInvoiceDate",
  "createDate",
  "contractDate",
  "reserveDate",
  "estimatedArrival",
];

export function parseCalendarDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPresetRange(preset?: DatePreset): { fromDate?: string; toDate?: string } {
  if (!preset) {
    return {};
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(startOfToday);
  const start = new Date(startOfToday);

  if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }

  if (preset === "last7Days") {
    start.setDate(start.getDate() - 6);
  }

  if (preset === "last30Days") {
    start.setDate(start.getDate() - 29);
  }

  if (preset === "thisMonth") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }

  if (preset === "lastMonth") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  }

  if (preset === "thisYear") {
    start.setMonth(0, 1);
  }

  return {
    fromDate: toDateInputValue(start),
    toDate: toDateInputValue(end),
  };
}

export function itemMatchesDateFilters(item: InventoryItem, filters: InventoryFilters): boolean {
  const range = filters.datePreset ? getPresetRange(filters.datePreset) : {};
  const exactDate = parseCalendarDate(filters.exactDate);
  const fromDate = parseCalendarDate(range.fromDate ?? filters.fromDate);
  const toDate = parseCalendarDate(range.toDate ?? filters.toDate);

  if (!exactDate && !fromDate && !toDate) {
    return true;
  }

  const fields = filters.dateField === "all" ? relevantDateFields : [filters.dateField];

  return fields.some((field) => {
    const itemDate = parseCalendarDate(item[field]);
    if (!itemDate) {
      return false;
    }

    if (exactDate) {
      return itemDate.getTime() === exactDate.getTime();
    }

    if (fromDate && itemDate < fromDate) {
      return false;
    }

    if (toDate && itemDate > toDate) {
      return false;
    }

    return true;
  });
}
