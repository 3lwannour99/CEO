import type {
  AggregatedStockItem,
  DashboardSummary,
  InventoryAlert,
  InventoryItem,
  InventorySummary,
  LocationStock,
  LogisticsStatus,
  ReplenishmentSuggestion,
  SalesPerformanceItem,
  SalesPerformanceResponse,
  StockCoverageItem,
} from "@/types/inventory";

function sumQuantity(items: InventoryItem[]) {
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function sumSoldPrice(items: InventoryItem[]) {
  return items.reduce((sum, item) => sum + item.soldPrice, 0);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function groupBy<T, R>(items: T[], keyFactory: (item: T) => string, mapper: (items: T[]) => R): R[] {
  const groups = items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFactory(item) || "Unknown";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.values(groups).map(mapper);
}

function soldInLast90Days(item: InventoryItem) {
  if (!item.isSold || !item.arInvoiceDate) {
    return false;
  }

  const date = new Date(item.arInvoiceDate);
  return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 90 * 86_400_000;
}

function stockKey(item: InventoryItem) {
  return `${item.brand}|${item.model}|${item.exteriorColor}`;
}

export function calculateInventorySummary(items: InventoryItem[]): InventorySummary {
  const currentStock = items.filter((item) => item.isInStock);
  const soldLast90Days = sumQuantity(items.filter(soldInLast90Days));
  const averageMonthlySales = soldLast90Days / 3;

  return {
    totalUnits: sumQuantity(items),
    currentStockUnits: sumQuantity(currentStock),
    soldUnits: sumQuantity(items.filter((item) => item.isSold)),
    reservedUnits: sumQuantity(items.filter((item) => item.isReserved)),
    fastMovingUnits: sumQuantity(items.filter((item) => item.movementCategory === "fast")),
    mediumMovingUnits: sumQuantity(items.filter((item) => item.movementCategory === "medium")),
    slowMovingUnits: sumQuantity(items.filter((item) => item.movementCategory === "slow")),
    unknownAgeUnits: sumQuantity(items.filter((item) => item.movementCategory === "unknown")),
    inTransitUnits: sumQuantity(items.filter((item) => item.estimatedArrival && !item.grpoDate && !item.isSold)),
    readyForSaleUnits: sumQuantity(items.filter((item) => item.isReadyForSale)),
    stockCoverageMonths: averageMonthlySales > 0 ? round(sumQuantity(currentStock) / averageMonthlySales) : null,
    sources: groupBy(items, (item) => item.sourceId, (group) => ({
      sourceId: group[0]?.sourceId ?? "",
      sourceName: group[0]?.sourceName ?? "",
      country: group[0]?.sourceCountry ?? "",
      totalUnits: sumQuantity(group),
      currentStockUnits: sumQuantity(group.filter((item) => item.isInStock)),
    })),
  };
}

export function calculateAlerts(items: InventoryItem[], generatedAt: string, sourceErrors = [] as { sourceId: string; sourceName: string }[]): InventoryAlert[] {
  return [
    ...sourceErrors.map((error) => ({
      id: `source-${error.sourceId}`,
      title: "Source API failure",
      message: `${error.sourceName} could not be reached.`,
      severity: "critical" as const,
      branch: error.sourceName,
      createdAt: generatedAt,
    })),
    ...items
      .filter((item) => item.isInStock && item.movementCategory === "slow")
      .slice(0, 25)
      .map((item) => ({
        id: `slow-${item.sourceId}-${item.chassis || item.itemCode}`,
        title: "Slow stock 90+ days",
        message: `${item.brand} ${item.model} has ${item.stockAgeDays ?? 0} stock age days.`,
        severity: "warning" as const,
        branch: item.branch || item.sourceName,
        createdAt: generatedAt,
      })),
    ...items
      .filter((item) => item.isInStock && item.movementCategory === "unknown")
      .slice(0, 25)
      .map((item) => ({
        id: `unknown-age-${item.sourceId}-${item.chassis || item.itemCode}`,
        title: "Unknown stock age",
        message: `${item.brand} ${item.model} has no usable stock date.`,
        severity: "info" as const,
        branch: item.branch || item.sourceName,
        createdAt: generatedAt,
      })),
  ];
}

export function calculateReplenishment(items: InventoryItem[]): ReplenishmentSuggestion[] {
  return groupBy(items, stockKey, (group) => {
    const currentStock = sumQuantity(group.filter((item) => item.isInStock));
    const soldLast90Days = sumQuantity(group.filter(soldInLast90Days));
    const averageMonthlySales = soldLast90Days / 3;
    const reorderPoint = Math.ceil(averageMonthlySales * 1.5);

    return {
      brand: group[0]?.brand ?? "",
      model: group[0]?.model ?? "",
      exteriorColor: group[0]?.exteriorColor ?? "",
      currentStock,
      soldLast90Days,
      averageMonthlySales: round(averageMonthlySales),
      suggestedOrderQuantity: Math.max(0, Math.ceil(reorderPoint - currentStock)),
      reorderPoint,
    };
  }).sort((a, b) => b.suggestedOrderQuantity - a.suggestedOrderQuantity);
}

export function calculateStockCoverage(items: InventoryItem[]): StockCoverageItem[] {
  return calculateReplenishment(items).map((item) => {
    const coverageMonths = item.averageMonthlySales > 0 ? round(item.currentStock / item.averageMonthlySales) : null;
    return {
      ...item,
      coverageMonths,
      status: coverageMonths === null ? "unknown" : coverageMonths < 1 ? "danger" : coverageMonths > 4 ? "overstock" : "healthy",
    };
  });
}

export function calculateSalesPerformance(items: InventoryItem[]): SalesPerformanceResponse {
  const sold = items.filter((item) => item.isSold);
  const byModel = groupBy(sold, (item) => `${item.brand}|${item.model}`, (group): SalesPerformanceItem => ({
    brand: group[0]?.brand ?? "",
    model: group[0]?.model ?? "",
    unitsSold: sumQuantity(group),
    revenue: sumSoldPrice(group),
  })).sort((a, b) => b.unitsSold - a.unitsSold);

  return {
    soldUnitsByModel: byModel,
    soldUnitsByBranch: groupBy(sold, (item) => item.branch || "Unknown", (group) => ({
      branch: group[0]?.branch || "Unknown",
      unitsSold: sumQuantity(group),
    })),
    soldUnitsBySource: groupBy(sold, (item) => item.sourceId, (group) => ({
      sourceId: group[0]?.sourceId ?? "",
      sourceName: group[0]?.sourceName ?? "",
      country: group[0]?.sourceCountry ?? "",
      unitsSold: sumQuantity(group),
    })),
    soldRevenue: sumSoldPrice(sold),
    customerGroupBreakdown: groupBy(sold, (item) => item.customerGroup || "Unknown", (group) => ({
      customerGroup: group[0]?.customerGroup || "Unknown",
      unitsSold: sumQuantity(group),
    })),
    topSellingModels: byModel.slice(0, 10),
    lowestSellingModels: [...byModel].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10),
  };
}

export function calculateAggregatedStock(items: InventoryItem[]): AggregatedStockItem[] {
  return groupBy(items.filter((item) => item.isInStock), stockKey, (group) => ({
    brand: group[0]?.brand ?? "",
    model: group[0]?.model ?? "",
    exteriorColor: group[0]?.exteriorColor ?? "",
    units: sumQuantity(group),
  })).sort((a, b) => b.units - a.units);
}

export function calculateLogistics(items: InventoryItem[]): LogisticsStatus[] {
  return items
    .filter((item) => item.poNo || item.estimatedArrival || item.grpoDate || item.apInvoiceDate)
    .map((item) => ({
      poNo: item.poNo,
      status: item.isSold ? "Sold" : item.estimatedArrival && !item.grpoDate ? "In Transit" : item.grpoDate ? "Warehouse" : "Unknown",
      estimatedArrival: item.estimatedArrival,
      grpoDate: item.grpoDate,
      apInvoiceDate: item.apInvoiceDate,
      units: item.quantity,
      branch: item.branch,
      warehouse: item.warehouse,
      sourceName: item.sourceName,
    }));
}

export function calculateMultiLocation(items: InventoryItem[]): LocationStock[] {
  return groupBy(
    items.filter((item) => item.isInStock),
    (item) => `${item.sourceId}|${item.branch}|${item.warehouse}|${item.brand}|${item.model}|${item.exteriorColor}`,
    (group) => ({
      sourceName: group[0]?.sourceName ?? "",
      country: group[0]?.sourceCountry ?? "",
      branch: group[0]?.branch ?? "",
      warehouse: group[0]?.warehouse ?? "",
      brand: group[0]?.brand ?? "",
      model: group[0]?.model ?? "",
      exteriorColor: group[0]?.exteriorColor ?? "",
      currentStock: sumQuantity(group),
    }),
  );
}

export function calculateDashboardSummary(items: InventoryItem[], generatedAt: string, sourceErrors = [] as { sourceId: string; sourceName: string }[]): DashboardSummary {
  const summary = calculateInventorySummary(items);
  const sales = calculateSalesPerformance(items);
  const alerts = calculateAlerts(items, generatedAt, sourceErrors);
  const currentStock = items.filter((item) => item.isInStock);

  return {
    metrics: {
      totalUnits: summary.totalUnits,
      currentStockUnits: summary.currentStockUnits,
      soldUnits: summary.soldUnits,
      reservedUnits: summary.reservedUnits,
      fastMovingUnits: summary.fastMovingUnits,
      mediumMovingUnits: summary.mediumMovingUnits,
      slowMovingUnits: summary.slowMovingUnits,
      inTransitUnits: summary.inTransitUnits,
      readyForSaleUnits: summary.readyForSaleUnits,
      stockCoverageMonths: summary.stockCoverageMonths,
    },
    inventoryStatusSummary: {
      readyPercent: summary.currentStockUnits > 0 ? Math.round((summary.readyForSaleUnits / summary.currentStockUnits) * 100) : 0,
      reservedUnits: summary.reservedUnits,
      serviceHoldUnits: items.filter((item) => ["notAvailable", "cession", "contract", "error"].includes(item.normalizedStatus)).length,
      averageCoverageMonths: summary.stockCoverageMonths,
    },
    topSellingModels: sales.topSellingModels.slice(0, 5),
    slowStockList: currentStock
      .filter((item) => item.movementCategory === "slow")
      .sort((a, b) => (b.stockAgeDays ?? 0) - (a.stockAgeDays ?? 0))
      .slice(0, 10),
    recentAlerts: alerts.slice(0, 10),
    stockByLocation: groupBy(currentStock, (item) => item.branch || item.sourceName || "Unknown", (group) => ({
      location: group[0]?.branch || group[0]?.sourceName || "Unknown",
      available: sumQuantity(group),
      reserved: sumQuantity(group.filter((item) => item.isReserved)),
      inTransit: sumQuantity(group.filter((item) => item.estimatedArrival && !item.grpoDate)),
      slowMoving: sumQuantity(group.filter((item) => item.movementCategory === "slow")),
    })),
    salesPerformanceSnapshot: sales.topSellingModels.slice(0, 5),
    logisticsStatusSnapshot: calculateLogistics(items).slice(0, 10),
    meta: {
      total: items.length,
      generatedAt,
      fromCache: true,
      sourceCount: 0,
      successfulSources: 0,
      failedSources: sourceErrors.length,
      errors: [],
    },
  };
}
