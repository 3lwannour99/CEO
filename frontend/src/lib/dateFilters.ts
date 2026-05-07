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

const reservedStatuses = new Set(["reserve", "reservationForCompanies"]);
const dateTimestampCache = new WeakMap<InventoryItem, Partial<Record<Exclude<DateField, "all">, number | null>>>();

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

function parseCalendarTimestamp(value?: string | null): number | null {
  return parseCalendarDate(value)?.getTime() ?? null;
}

function isTimestampInSelectedRange(itemTimestamp: number, exactTimestamp: number | null, fromTimestamp: number | null, toTimestamp: number | null): boolean {
  if (exactTimestamp !== null) {
    return itemTimestamp === exactTimestamp;
  }

  if (fromTimestamp !== null && itemTimestamp < fromTimestamp) {
    return false;
  }

  if (toTimestamp !== null && itemTimestamp > toTimestamp) {
    return false;
  }

  return true;
}

function itemDateTimestamp(item: InventoryItem, field: Exclude<DateField, "all">): number | null {
  const cached = dateTimestampCache.get(item);

  if (cached && field in cached) {
    return cached[field] ?? null;
  }

  const nextCache = cached ?? {};
  const timestamp = parseCalendarTimestamp(item[field]);
  nextCache[field] = timestamp;
  dateTimestampCache.set(item, nextCache);

  return timestamp;
}

function itemDateIsInSelectedRange(item: InventoryItem, field: Exclude<DateField, "all">, exactDate: Date | null, fromDate: Date | null, toDate: Date | null): boolean {
  const itemTimestamp = itemDateTimestamp(item, field);

  return itemTimestamp !== null && isTimestampInSelectedRange(itemTimestamp, exactDate?.getTime() ?? null, fromDate?.getTime() ?? null, toDate?.getTime() ?? null);
}

function itemStatusIs(item: InventoryItem, status: string): boolean {
  return item.normalizedStatus === status;
}

function itemIsReserved(item: InventoryItem): boolean {
  return reservedStatuses.has(String(item.normalizedStatus));
}

function itemIsInStock(item: InventoryItem): boolean {
  return item.isInStock || itemStatusIs(item, "inStock");
}

function itemIsInTransit(item: InventoryItem): boolean {
  return String(item.normalizedStatus) === "in-transit" || Boolean(item.estimatedArrival && !item.grpoDate && !item.isSold);
}

function itemMatchesSelectedDateField(item: InventoryItem, field: Exclude<DateField, "all">, exactDate: Date | null, fromDate: Date | null, toDate: Date | null): boolean {
  if (field === "arInvoiceDate") {
    if (itemStatusIs(item, "sold")) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // A/R invoice dates only belong to sold vehicles, so unrelated stock/reserved rows stay visible.
    return true;
  }

  if (field === "reserveDate") {
    if (itemIsReserved(item)) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // Reserve dates only belong to reserved vehicles, so sold/stock rows are not removed by this filter.
    return true;
  }

  if (field === "contractDate") {
    if (itemDateTimestamp(item, "contractDate") !== null) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // Missing contract dates are unrelated unless the row itself is in contract status.
    return !itemStatusIs(item, "contract");
  }

  if (field === "grpoDate") {
    if (itemIsInStock(item)) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // GRPO dates mainly apply to inventory rows, so sold/non-stock rows stay visible.
    return true;
  }

  if (field === "apInvoiceDate") {
    if (itemDateTimestamp(item, "apInvoiceDate") !== null) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // AP invoice dates are expected for current inventory; unrelated rows without one stay visible.
    return !itemIsInStock(item);
  }

  if (field === "createDate") {
    if (itemDateTimestamp(item, "createDate") !== null) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // Create date filtering only applies to rows that actually provide a create date.
    return true;
  }

  if (field === "estimatedArrival") {
    if (itemDateTimestamp(item, "estimatedArrival") !== null) {
      return itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate);
    }

    // ETA is meaningful for in-transit rows; other rows without ETA should not disappear.
    return !itemIsInTransit(item);
  }

  return true;
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

  if (filters.dateField === "all") {
    return relevantDateFields.some((field) => itemDateIsInSelectedRange(item, field, exactDate, fromDate, toDate));
  }

  return itemMatchesSelectedDateField(item, filters.dateField, exactDate, fromDate, toDate);
}
