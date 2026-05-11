import { chartColorForKey, chartColors } from "@/constants/chartColors";
import type {
  AggregatedStockItem,
  InventoryAlert,
  InventoryItem,
  InventoryMovementMatrixItem,
  LogisticsStatus,
  MonthlyComparison,
  ReplenishmentSuggestion,
  SalesPerformanceItem,
  StockCoverageItem,
  StockRule,
} from "@/types/inventory";

export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}

export type StackedChartDatum = { name: string } & Record<string, string | number>;

function quantity(item: Pick<InventoryItem, "quantity">) {
  return item.quantity || 1;
}

function cleanLabel(value: unknown, fallback = "Unknown") {
  const label = String(value ?? "").trim();
  return label || fallback;
}

function sortDesc<T extends { value: number }>(items: T[]) {
  return [...items].sort((left, right) => right.value - left.value);
}

export function topN<T extends { value: number }>(items: T[], limit = 10) {
  return sortDesc(items).slice(0, limit);
}

function grouped<T>(items: T[], label: (item: T) => string, value: (item: T) => number, limit = 10): ChartDatum[] {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    const key = label(item);
    totals.set(key, (totals.get(key) ?? 0) + value(item));
  });

  return topN(Array.from(totals, ([name, total]) => ({ name, value: total })), limit);
}

function monthKey(value?: string | null) {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

export function groupByStatus(items: InventoryItem[]): ChartDatum[] {
  const statusOrder = [
    ["inStock", "In Stock", chartColors.inStock],
    ["sold", "Sold", chartColors.sold],
    ["reserve", "Reserve", chartColors.reserve],
    ["reservationForCompanies", "Reservation for Companies", chartColors.reservationForCompanies],
    ["contract", "Contract", chartColors.contract],
    ["cession", "Cession", chartColors.cession],
    ["unknown", "Unknown", chartColors.unknown],
  ] as const;
  const totals = new Map(statusOrder.map(([key]) => [key, 0]));

  items.forEach((item) => {
    const normalized = String(item.normalizedStatus || item.chassisStatus || item.displayStatus || "").toLowerCase().replace(/[\s_-]+/g, "");
    const key = statusOrder.find(([candidate]) => normalized.includes(candidate.toLowerCase()))?.[0] ?? (item.isSold ? "sold" : item.isReserved ? "reserve" : item.isInStock ? "inStock" : "unknown");
    totals.set(key, (totals.get(key) ?? 0) + quantity(item));
  });

  return statusOrder.map(([key, name, color]) => ({ name, value: totals.get(key) ?? 0, color }));
}

export function groupByMovementCategory(items: InventoryItem[]): ChartDatum[] {
  const labels = [
    ["fast", "Fast", chartColors.fast],
    ["medium", "Medium", chartColors.medium],
    ["slow", "Slow", chartColors.slow],
    ["unknown", "Unknown", chartColors.unknown],
  ] as const;
  const totals = new Map(labels.map(([key]) => [key, 0]));

  items.forEach((item) => {
    const key = labels.some(([candidate]) => candidate === item.movementCategory) ? item.movementCategory : "unknown";
    totals.set(key, (totals.get(key) ?? 0) + quantity(item));
  });

  return labels.map(([key, name, color]) => ({ name, value: totals.get(key) ?? 0, color }));
}

export function groupByBrand(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => cleanLabel(item.brand), quantity, limit);
}

export function groupByModel(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => cleanLabel(item.model), quantity, limit);
}

export function groupByModelAndColor(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => `${cleanLabel(item.model)} / ${cleanLabel(item.exteriorColor)}`, quantity, limit);
}

export function groupByWarehouse(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => cleanLabel(item.warehouse), quantity, limit);
}

export function groupByBranch(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => cleanLabel(item.branch), quantity, limit);
}

export function groupBySource(items: InventoryItem[], limit = 10) {
  return grouped(items, (item) => cleanLabel(item.sourceName || item.sourceId), quantity, limit);
}

export function groupSalesByMonth(items: InventoryItem[], limit = 12) {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    if (!item.isSold) return;
    const key = monthKey(item.arInvoiceDate);
    if (!key) return;
    totals.set(key, (totals.get(key) ?? 0) + quantity(item));
  });

  return Array.from(totals, ([name, sold]) => ({ name, sold })).sort((left, right) => left.name.localeCompare(right.name)).slice(-limit);
}

export function groupSalesBySalesman(items: InventoryItem[], limit = 10) {
  return grouped(items.filter((item) => item.isSold), (item) => cleanLabel(item.salesMan), quantity, limit);
}

export function groupStockCoverage(rows: StockCoverageItem[]): ChartDatum[] {
  return grouped(rows, (row) => cleanLabel(row.status), (row) => row.currentStock, 10).map((item, index) => ({ ...item, color: chartColorForKey(item.name, index) }));
}

export function groupReplenishmentUrgency(rows: ReplenishmentSuggestion[]): ChartDatum[] {
  return grouped(rows, (row) => cleanLabel(row.urgency), (row) => row.suggestedOrderQuantity || 1, 10).map((item, index) => ({ ...item, color: chartColorForKey(item.name, index) }));
}

export function groupAlertsBySeverity(rows: InventoryAlert[]): ChartDatum[] {
  return grouped(rows, (row) => cleanLabel(row.severity), (row) => row.affectedUnits ?? row.affectedCount ?? 1, 10).map((item, index) => ({ ...item, color: chartColorForKey(item.name, index) }));
}

export function groupAlertsByType(rows: InventoryAlert[], limit = 10) {
  return grouped(rows, (row) => cleanLabel(row.type ?? row.title), (row) => row.affectedUnits ?? row.affectedCount ?? 1, limit);
}

export function groupLogisticsStatus(rows: LogisticsStatus[]): ChartDatum[] {
  return grouped(rows, (row) => cleanLabel(row.status), (row) => row.units || 1, 10);
}

export function groupSnapshotMonthlyComparison(rows: MonthlyComparison[]) {
  return rows.map((row) => ({
    name: row.periodLabel ?? row.month,
    total: row.totalUnits,
    stock: row.inStockUnits ?? 0,
    sold: row.soldUnits,
    reserved: row.reservedUnits,
    slow: row.slowUnits,
    medium: row.mediumUnits,
    fast: row.fastUnits,
    SAR: row.stockValueSar,
    JOD: row.stockValueJod,
    USD: row.stockValueUsd,
  }));
}

export function movementMatrixRows(rows: InventoryMovementMatrixItem[], limit = 10): StackedChartDatum[] {
  return [...rows]
    .sort((left, right) => right.totalCount - left.totalCount)
    .slice(0, limit)
    .map((row) => ({
      name: cleanLabel(row.model),
      fast: row.fastCount,
      medium: row.mediumCount,
      slow: row.slowCount,
      unknown: row.unknownCount,
    }));
}

export function averageDaysByModel(rows: InventoryMovementMatrixItem[], limit = 10): ChartDatum[] {
  return topN(rows.map((row) => ({ name: cleanLabel(row.model), value: row.averageDaysInStock ?? 0 })), limit);
}

export function suggestedOrdersByModel(rows: ReplenishmentSuggestion[], limit = 10) {
  return topN(rows.map((row) => ({ name: cleanLabel(row.model), value: row.suggestedOrderQuantity })), limit);
}

export function stockVsReorder(rows: ReplenishmentSuggestion[], limit = 10): StackedChartDatum[] {
  return [...rows]
    .sort((left, right) => (right.reorderPoint - right.currentStock) - (left.reorderPoint - left.currentStock))
    .slice(0, limit)
    .map((row) => ({ name: cleanLabel(row.model), stock: row.currentStock, reorder: row.reorderPoint }));
}

export function coverageByModel(rows: StockCoverageItem[], limit = 10) {
  return topN(rows.map((row) => ({ name: cleanLabel(row.model), value: row.coverageMonths ?? 0 })), limit);
}

export function salesItemsToBars(rows: SalesPerformanceItem[], limit = 10) {
  return topN(rows.map((row) => ({ name: cleanLabel(row.model || row.exteriorColor || row.branch || row.sourceName), value: row.unitsSold })), limit);
}

export function revenueBySalesItems(rows: SalesPerformanceItem[], limit = 10) {
  return topN(rows.map((row) => ({ name: cleanLabel(row.model || row.exteriorColor || row.branch || row.sourceName), value: row.revenue.usd })), limit);
}

export function aggregatedByWarehouse(rows: AggregatedStockItem[], limit = 10) {
  return grouped(rows, (row) => cleanLabel(row.warehouse), (row) => row.units, limit);
}

export function aggregatedColorDistribution(rows: AggregatedStockItem[], limit = 10) {
  return grouped(rows, (row) => cleanLabel(row.exteriorColor), (row) => row.units, limit);
}

export function aggregatedTypeColor(rows: AggregatedStockItem[], limit = 10): StackedChartDatum[] {
  const typeMap = new Map<string, Record<string, number>>();
  const colors = new Set<string>();

  rows.forEach((row) => {
    const type = cleanLabel(row.type);
    const color = cleanLabel(row.exteriorColor);
    colors.add(color);
    const current = typeMap.get(type) ?? {};
    current[color] = (current[color] ?? 0) + row.units;
    typeMap.set(type, current);
  });

  return Array.from(typeMap, ([name, values]) => ({ name, ...values, value: Object.values(values).reduce((sum, value) => sum + value, 0) }))
    .sort((left, right) => Number(right.value) - Number(left.value))
    .slice(0, limit);
}

export function stackedKeys(rows: StackedChartDatum[], limit = 6) {
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "name" && key !== "value")))).slice(0, limit);
}

export function logisticsCycleBySource(rows: LogisticsStatus[], limit = 10) {
  const buckets = new Map<string, { total: number; count: number }>();
  rows.forEach((row) => {
    if (typeof row.cycleTimeDays !== "number") return;
    const key = cleanLabel(row.sourceName);
    const bucket = buckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += row.cycleTimeDays;
    bucket.count += 1;
    buckets.set(key, bucket);
  });
  return topN(Array.from(buckets, ([name, bucket]) => ({ name, value: bucket.count ? Math.round(bucket.total / bucket.count) : 0 })), limit);
}

export function delayedShipmentsBySource(rows: LogisticsStatus[], limit = 10) {
  return grouped(rows.filter((row) => row.isDelayed || Number(row.supplierDelayDays) > 0), (row) => cleanLabel(row.sourceName), (row) => row.units || 1, limit);
}

export function ruleCountByWarehouse(rows: StockRule[], limit = 10) {
  return grouped(rows, (row) => cleanLabel(row.warehouse ?? row.sourceId), () => 1, limit);
}

export function rulesByMinMax(rows: StockRule[]) {
  return [
    { name: "Min stock", value: rows.reduce((sum, row) => sum + row.minStock, 0), color: chartColors.warning },
    { name: "Reorder point", value: rows.reduce((sum, row) => sum + row.reorderPoint, 0), color: chartColors.info },
    { name: "Max stock", value: rows.reduce((sum, row) => sum + row.maxStock, 0), color: chartColors.success },
  ];
}
