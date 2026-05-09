import type {
  AggregatedStockItem,
  DashboardSummary,
  InventoryAlert,
  InventoryItem,
  InventorySummary,
  LocationStock,
  LogisticsStatus,
  MultiLocationReport,
  RebalancingRecommendation,
  ReplenishmentSuggestion,
  SalesPerformanceItem,
  SalesPerformanceResponse,
  StockCoverageItem,
} from "@/types/inventory";
import { createMoneyTotals, sumMoney } from "@/lib/currency";

type Rule = {
  sourceId?: string | null;
  brand?: string | null;
  model?: string | null;
  type?: string | null;
  exteriorColor?: string | null;
  warehouse?: string | null;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  targetCoverageMonths: number;
  leadTimeDays: number;
  isActive?: boolean;
};

const defaultRule: Rule = {
  minStock: 1,
  maxStock: 10,
  reorderPoint: 2,
  targetCoverageMonths: 3,
  leadTimeDays: 30,
  isActive: true,
};

function sumQuantity(items: InventoryItem[]) {
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function groupBy<T, R>(
  items: T[],
  keyFactory: (item: T) => string,
  mapper: (items: T[]) => R,
): R[] {
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

function soldInLast30Days(item: InventoryItem) {
  if (!item.isSold || !item.arInvoiceDate) {
    return false;
  }

  const date = new Date(item.arInvoiceDate);
  return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 30 * 86_400_000;
}

function stockKey(item: InventoryItem) {
  return `${item.brand}|${item.model}|${item.exteriorColor}`;
}

function modelKey(item: InventoryItem) {
  return `${item.brand}|${item.model}`;
}

function chassisGroupKey(item: InventoryItem) {
  return `${item.sourceId}|${item.chassis}`;
}

export function calculateInventorySummary(items: InventoryItem[]): InventorySummary {
  const currentStock = items.filter((item) => item.isInStock);
  const soldLast90Days = sumQuantity(items.filter(soldInLast90Days));
  const averageMonthlySales = soldLast90Days / 3;
  const chassisGroups = groupBy(
    items.filter((item) => Boolean(item.chassis)),
    chassisGroupKey,
    (group) => group,
  );
  const multiStatusGroups = chassisGroups.filter((group) => group.length > 1);

  return {
    totalRows: items.length,
    uniqueChassisCount: chassisGroups.length,
    multiStatusChassisCount: multiStatusGroups.length,
    rowsInMultiStatusChassisGroups: multiStatusGroups.reduce((sum, group) => sum + group.length, 0),
    totalUnits: sumQuantity(currentStock),
    currentStockUnits: sumQuantity(currentStock),
    soldUnits: sumQuantity(items.filter((item) => item.isSold)),
    reservedUnits: sumQuantity(items.filter((item) => item.isReserved)),
    fastMovingUnits: sumQuantity(currentStock.filter((item) => item.movementCategory === "fast")),
    mediumMovingUnits: sumQuantity(
      currentStock.filter((item) => item.movementCategory === "medium"),
    ),
    slowMovingUnits: sumQuantity(currentStock.filter((item) => item.movementCategory === "slow")),
    unknownAgeUnits: sumQuantity(
      currentStock.filter((item) => item.movementCategory === "unknown"),
    ),
    inTransitUnits: sumQuantity(
      items.filter((item) => item.estimatedArrival && !item.grpoDate && !item.isSold),
    ),
    readyForSaleUnits: sumQuantity(items.filter((item) => item.isReadyForSale)),
    stockCoverageMonths:
      averageMonthlySales > 0 ? round(sumQuantity(currentStock) / averageMonthlySales) : null,
    sources: groupBy(
      items,
      (item) => item.sourceId,
      (group) => ({
        sourceId: group[0]?.sourceId ?? "",
        sourceName: group[0]?.sourceName ?? "",
        country: group[0]?.sourceCountry ?? "",
        totalUnits: sumQuantity(group),
        currentStockUnits: sumQuantity(group.filter((item) => item.isInStock)),
      }),
    ),
  };
}

export function calculateAlerts(
  items: InventoryItem[],
  generatedAt: string,
  sourceErrors = [] as { sourceId: string; sourceName: string }[],
  rules: Rule[] = [],
): InventoryAlert[] {
  const replenishment = calculateReplenishment(items, rules);
  const coverage = calculateStockCoverage(items, rules);
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
    ...replenishment
      .filter((item) => item.currentStock <= item.minStock)
      .map((item) => ({
        id: `low-stock-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
        title: "Low Stock",
        message: `${item.brand} ${item.model} is below min stock (${item.currentStock}/${item.minStock}).`,
        severity: "critical" as const,
        branch: item.warehouse || item.sourceName || "",
        createdAt: generatedAt,
      })),
    ...replenishment
      .filter((item) => item.currentStock <= item.reorderPoint)
      .map((item) => ({
        id: `reorder-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
        title: "Below Reorder Point",
        message: `${item.brand} ${item.model} suggested order quantity: ${item.suggestedOrderQuantity}.`,
        severity: "warning" as const,
        branch: item.warehouse || item.sourceName || "",
        createdAt: generatedAt,
      })),
    ...coverage
      .filter((item) => item.status === "danger" || item.status === "overstock")
      .map((item) => ({
        id: `coverage-${item.status}-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
        title: item.status === "danger" ? "Coverage Danger" : "Overstock",
        message: `${item.brand} ${item.model} coverage is ${item.coverageMonths ?? "not available"} months.`,
        severity: item.status === "danger" ? ("critical" as const) : ("warning" as const),
        branch: item.warehouse || item.sourceName || "",
        createdAt: generatedAt,
      })),
    ...items
      .filter((item) => item.isReserved && reservationAgeDays(item) > 30)
      .slice(0, 25)
      .map((item) => ({
        id: `old-reservation-${item.sourceId}-${item.chassis || item.itemCode}`,
        title: "Old Reservation",
        message: `${item.brand} ${item.model} reservation is older than 30 days.`,
        severity: "warning" as const,
        branch: item.branch || item.sourceName,
        createdAt: generatedAt,
      })),
  ];
}

export function calculateReplenishment(
  items: InventoryItem[],
  rules: Rule[] = [],
): ReplenishmentSuggestion[] {
  return groupBy(items, stockKey, (group) => {
    const sample = group[0];
    const rule = sample ? resolveRule(sample, rules) : defaultRule;
    const currentStock = sumQuantity(group.filter((item) => item.isInStock));
    const soldLast90Days = sumQuantity(group.filter(soldInLast90Days));
    const soldLast30Days = sumQuantity(group.filter(soldInLast30Days));
    const averageMonthlySales = soldLast90Days / 3;
    const averageDailySales = soldLast90Days / 90;
    const leadTimeDemand = averageDailySales * rule.leadTimeDays;
    const suggestedOrderQuantity = Math.max(0, rule.maxStock - currentStock);
    const urgency: ReplenishmentSuggestion["urgency"] =
      currentStock <= rule.minStock
        ? "critical"
        : currentStock <= rule.reorderPoint
          ? "high"
          : suggestedOrderQuantity > 0
            ? "medium"
            : "low";

    return {
      brand: group[0]?.brand ?? "",
      model: group[0]?.model ?? "",
      type: group[0]?.type ?? "",
      exteriorColor: group[0]?.exteriorColor ?? "",
      warehouse: group[0]?.warehouse ?? "",
      sourceId: group[0]?.sourceId ?? "",
      sourceName: group[0]?.sourceName ?? "",
      currentStock,
      minStock: rule.minStock,
      maxStock: rule.maxStock,
      soldLast90Days,
      soldLast30Days,
      averageMonthlySales: round(averageMonthlySales),
      leadTimeDays: rule.leadTimeDays,
      leadTimeDemand: round(leadTimeDemand),
      suggestedOrderQuantity,
      reorderPoint: rule.reorderPoint,
      targetCoverageMonths: rule.targetCoverageMonths,
      urgency,
      reason:
        urgency === "critical"
          ? "Current stock is below minimum stock."
          : urgency === "high"
            ? "Current stock is below reorder point."
            : suggestedOrderQuantity > 0
              ? "Stock is below max target."
              : "Stock is within configured range.",
    };
  }).sort(
    (a, b) =>
      urgencyRank(b.urgency) - urgencyRank(a.urgency) ||
      b.suggestedOrderQuantity - a.suggestedOrderQuantity,
  );
}

export function calculateStockCoverage(
  items: InventoryItem[],
  rules: Rule[] = [],
): StockCoverageItem[] {
  return calculateReplenishment(items, rules).map((item) => {
    const coverageMonths =
      item.averageMonthlySales > 0 ? round(item.currentStock / item.averageMonthlySales) : null;
    const status =
      coverageMonths === null
        ? "noSalesData"
        : coverageMonths < 1
          ? "danger"
          : coverageMonths > 4
            ? "overstock"
            : "healthy";
    return {
      ...item,
      coverageMonths,
      status,
      recommendedAction:
        status === "danger"
          ? "Reorder immediately or rebalance stock."
          : status === "overstock"
            ? "Pause ordering and consider transfer or promotion."
            : status === "noSalesData"
              ? "Not available from current data."
              : "Maintain current plan.",
    };
  });
}

export function calculateSalesPerformance(items: InventoryItem[]): SalesPerformanceResponse {
  const sold = items.filter((item) => item.isSold);
  const byModel = groupBy(
    sold,
    (item) => `${item.brand}|${item.model}`,
    (group): SalesPerformanceItem => ({
      brand: group[0]?.brand ?? "",
      model: group[0]?.model ?? "",
      unitsSold: sumQuantity(group),
      revenue: sumMoney(group, (item) => item.soldPrice),
    }),
  ).sort((a, b) => b.unitsSold - a.unitsSold || b.revenue.usd - a.revenue.usd);
  const soldByModel = new Map(byModel.map((item) => [`${item.brand}|${item.model}`, item]));
  const stockModels = groupBy(
    items.filter((item) => item.isInStock),
    modelKey,
    (group): SalesPerformanceItem => {
      const soldModel = soldByModel.get(modelKey(group[0]));
      return {
        brand: group[0]?.brand ?? "",
        model: group[0]?.model ?? "",
        unitsSold: soldModel?.unitsSold ?? 0,
        revenue: soldModel?.revenue ?? createMoneyTotals(),
      };
    },
  );
  const lowestSellingModels = [
    ...new Map(
      [...byModel, ...stockModels].map((item) => [`${item.brand}|${item.model}`, item]),
    ).values(),
  ]
    .sort((a, b) => a.unitsSold - b.unitsSold || a.model.localeCompare(b.model))
    .slice(0, 10);

  return {
    soldUnitsByModel: byModel,
    soldUnitsByBranch: groupBy(
      sold,
      (item) => item.branch || "Unknown",
      (group) => ({
        branch: group[0]?.branch || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    soldUnitsBySource: groupBy(
      sold,
      (item) => item.sourceId,
      (group) => ({
        sourceId: group[0]?.sourceId ?? "",
        sourceName: group[0]?.sourceName ?? "",
        country: group[0]?.sourceCountry ?? "",
        unitsSold: sumQuantity(group),
      }),
    ),
    soldRevenue: sumMoney(sold, (item) => item.soldPrice),
    customerGroupBreakdown: groupBy(
      sold,
      (item) => item.customerGroup || "Unknown",
      (group) => ({
        customerGroup: group[0]?.customerGroup || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    topSellingModels: byModel.slice(0, 10),
    lowestSellingModels,
    averageMovement: round(sumQuantity(sold) / Math.max(1, byModel.length)),
    breakdownByModel: byModel,
    breakdownByType: groupBy(
      sold,
      (item) => item.type || "Unknown",
      (group) => ({
        type: group[0]?.type || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    breakdownByColor: groupBy(
      sold,
      (item) => item.exteriorColor || "Unknown",
      (group) => ({
        exteriorColor: group[0]?.exteriorColor || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    breakdownByBranch: groupBy(
      sold,
      (item) => item.branch || "Unknown",
      (group) => ({
        branch: group[0]?.branch || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    breakdownByCountry: groupBy(
      sold,
      (item) => item.sourceCountry || "Unknown",
      (group) => ({
        country: group[0]?.sourceCountry || "Unknown",
        unitsSold: sumQuantity(group),
      }),
    ),
    sellThroughRate: sellThroughRate(items),
    inventoryTurnover: inventoryTurnover(items),
  };
}

export function calculateAggregatedStock(items: InventoryItem[]): AggregatedStockItem[] {
  return groupBy(
    items.filter((item) => item.isInStock),
    stockKey,
    (group) => ({
      brand: group[0]?.brand ?? "",
      model: group[0]?.model ?? "",
      exteriorColor: group[0]?.exteriorColor ?? "",
      units: sumQuantity(group),
    }),
  ).sort((a, b) => b.units - a.units);
}

export function calculateLogistics(items: InventoryItem[]): LogisticsStatus[] {
  return items
    .filter((item) => item.poNo || item.estimatedArrival || item.grpoDate || item.apInvoiceDate)
    .map((item) => ({
      chassis: item.chassis,
      poNo: item.poNo,
      status: deriveLogisticsStatus(item),
      estimatedArrival: item.estimatedArrival,
      grpoDate: item.grpoDate,
      apInvoiceDate: item.apInvoiceDate,
      orderDate: orderDate(item),
      cycleTimeDays: daysBetween(orderDate(item), item.grpoDate),
      supplierDelayDays: daysBetween(item.estimatedArrival, item.grpoDate),
      isDelayed: (daysBetween(item.estimatedArrival, item.grpoDate) ?? 0) > 0,
      shippingCost: null,
      units: item.quantity,
      branch: item.branch,
      warehouse: item.warehouse,
      sourceName: item.sourceName,
    }));
}

export function calculateMultiLocation(
  items: InventoryItem[],
  rules: Rule[] = [],
): MultiLocationReport {
  const stockByLocation = groupBy(
    items.filter((item) => item.isInStock),
    (item) =>
      `${item.sourceId}|${item.branch}|${item.warehouse}|${item.brand}|${item.model}|${item.exteriorColor}`,
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
  const overstock = stockByLocation.filter(
    (location) => (location.currentStock ?? 0) > resolveRuleFromLocation(location, rules).maxStock,
  );
  const understock = stockByLocation.filter(
    (location) => (location.currentStock ?? 0) < resolveRuleFromLocation(location, rules).minStock,
  );
  const rebalancingRecommendations: RebalancingRecommendation[] = overstock.flatMap((from) =>
    understock
      .filter(
        (to) =>
          to.model === from.model &&
          to.exteriorColor === from.exteriorColor &&
          to.warehouse !== from.warehouse,
      )
      .map((to) => {
        const fromRule = resolveRuleFromLocation(from, rules);
        const toRule = resolveRuleFromLocation(to, rules);
        const surplus = Math.max(0, (from.currentStock ?? 0) - fromRule.maxStock);
        const shortage = Math.max(0, toRule.minStock - (to.currentStock ?? 0));
        return {
          brand: from.brand ?? "",
          model: from.model ?? "",
          exteriorColor: from.exteriorColor ?? "",
          fromWarehouse: from.warehouse ?? "",
          toWarehouse: to.warehouse ?? "",
          fromSourceName: from.sourceName,
          toSourceName: to.sourceName,
          suggestedTransferQuantity: Math.min(surplus, shortage),
        };
      })
      .filter((item) => item.suggestedTransferQuantity > 0),
  );

  return {
    stockByLocation,
    transferTracking: [],
    transferTrackingMessage: "Not available from current data",
    rebalancingRecommendations,
  };
}

export function calculateDashboardSummary(
  items: InventoryItem[],
  generatedAt: string,
  sourceErrors = [] as { sourceId: string; sourceName: string }[],
  rules: Rule[] = [],
): DashboardSummary {
  const summary = calculateInventorySummary(items);
  const sales = calculateSalesPerformance(items);
  const alerts = calculateAlerts(items, generatedAt, sourceErrors, rules);
  const replenishment = calculateReplenishment(items, rules);
  const logistics = calculateLogistics(items);
  const currentStock = items.filter((item) => item.isInStock);

  return {
    metrics: {
      totalRows: summary.totalRows,
      uniqueChassisCount: summary.uniqueChassisCount,
      multiStatusChassisCount: summary.multiStatusChassisCount,
      rowsInMultiStatusChassisGroups: summary.rowsInMultiStatusChassisGroups,
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
      sellThroughRate: sales.sellThroughRate,
      inventoryTurnover: sales.inventoryTurnover,
      alertCount: alerts.length,
      urgentReplenishmentCount: replenishment.filter(
        (item) => item.urgency === "critical" || item.urgency === "high",
      ).length,
      delayedLogisticsCount: logistics.filter((item) => item.isDelayed).length,
    },
    inventoryStatusSummary: {
      readyPercent:
        summary.currentStockUnits > 0
          ? Math.round((summary.readyForSaleUnits / summary.currentStockUnits) * 100)
          : 0,
      reservedUnits: summary.reservedUnits,
      serviceHoldUnits: items.filter((item) =>
        ["notAvailable", "cession", "contract", "error"].includes(item.normalizedStatus),
      ).length,
      averageCoverageMonths: summary.stockCoverageMonths,
    },
    topSellingModels: sales.topSellingModels.slice(0, 5),
    bottomSellingModels: sales.lowestSellingModels.slice(0, 5),
    slowStockList: currentStock
      .filter((item) => item.movementCategory === "slow")
      .sort((a, b) => (b.stockAgeDays ?? 0) - (a.stockAgeDays ?? 0))
      .slice(0, 10),
    recentAlerts: alerts.slice(0, 10),
    stockByLocation: groupBy(
      currentStock,
      (item) => item.branch || item.sourceName || "Unknown",
      (group) => ({
        location: group[0]?.branch || group[0]?.sourceName || "Unknown",
        available: sumQuantity(group),
        reserved: sumQuantity(group.filter((item) => item.isReserved)),
        inTransit: sumQuantity(group.filter((item) => item.estimatedArrival && !item.grpoDate)),
        slowMoving: sumQuantity(group.filter((item) => item.movementCategory === "slow")),
      }),
    ),
    salesPerformanceSnapshot: sales.topSellingModels.slice(0, 5),
    logisticsStatusSnapshot: logistics.slice(0, 10),
    meta: {
      total: summary.totalUnits,
      generatedAt,
      fromCache: true,
      sourceCount: new Set(items.map((item) => item.sourceId).filter(Boolean)).size,
      successfulSources: new Set(items.map((item) => item.sourceId).filter(Boolean)).size,
      failedSources: sourceErrors.length,
      errors: [],
    },
  };
}

function resolveRule(item: InventoryItem, rules: Rule[]) {
  const active = rules.filter((rule) => rule.isActive !== false);
  const candidates = [
    (rule: Rule) =>
      match(rule.sourceId, item.sourceId) &&
      match(rule.brand, item.brand) &&
      match(rule.model, item.model) &&
      match(rule.type, item.type) &&
      match(rule.exteriorColor, item.exteriorColor) &&
      match(rule.warehouse, item.warehouse),
    (rule: Rule) =>
      match(rule.sourceId, item.sourceId) &&
      match(rule.model, item.model) &&
      match(rule.exteriorColor, item.exteriorColor) &&
      !rule.warehouse,
    (rule: Rule) =>
      match(rule.model, item.model) &&
      match(rule.exteriorColor, item.exteriorColor) &&
      !rule.sourceId &&
      !rule.warehouse,
    (rule: Rule) =>
      match(rule.model, item.model) && !rule.sourceId && !rule.exteriorColor && !rule.warehouse,
    (rule: Rule) =>
      !rule.sourceId &&
      !rule.brand &&
      !rule.model &&
      !rule.type &&
      !rule.exteriorColor &&
      !rule.warehouse,
  ];

  return candidates.map((candidate) => active.find(candidate)).find(Boolean) ?? defaultRule;
}

function resolveRuleFromLocation(location: LocationStock, rules: Rule[]) {
  const item = {
    sourceId: location.sourceId ?? "",
    brand: location.brand ?? "",
    model: location.model ?? "",
    type: "",
    exteriorColor: location.exteriorColor ?? "",
    warehouse: location.warehouse ?? "",
  } as InventoryItem;
  return resolveRule(item, rules);
}

function match(ruleValue: string | null | undefined, itemValue: string) {
  return !ruleValue || ruleValue.toLowerCase() === (itemValue || "").toLowerCase();
}

function urgencyRank(urgency: ReplenishmentSuggestion["urgency"]) {
  return { low: 0, medium: 1, high: 2, critical: 3 }[urgency];
}

function sellThroughRate(items: InventoryItem[]) {
  const soldUnits = sumQuantity(items.filter((item) => item.isSold));
  const stockUnits = sumQuantity(items.filter((item) => item.isInStock));
  const denominator = soldUnits + stockUnits;
  return denominator > 0 ? round((soldUnits / denominator) * 100) : 0;
}

function inventoryTurnover(items: InventoryItem[]) {
  const soldUnits = sumQuantity(items.filter((item) => item.isSold));
  const stockUnits = sumQuantity(items.filter((item) => item.isInStock));
  // Current stock is a fallback for average inventory until historical snapshots accumulate.
  return round(soldUnits / Math.max(1, stockUnits));
}

function deriveLogisticsStatus(item: InventoryItem) {
  if (item.isSold) {
    return "Sold";
  }

  const haystack =
    `${item.notes} ${item.warehouse} ${item.rawStatus} ${item.displayStatus} ${item.soRemarks} ${item.additionalRemark}`.toLowerCase();
  if (haystack.includes("custom")) {
    return "Customs";
  }
  if (haystack.includes("port") || haystack.includes("ميناء")) {
    return "At Port";
  }
  if (item.grpoDate) {
    return "Warehouse";
  }
  if (item.estimatedArrival && !item.grpoDate) {
    return "In Transit";
  }
  return "Unknown";
}

function orderDate(item: InventoryItem) {
  return item.apInvoiceDate || item.createDate || item.contractDate || item.reserveDate || "";
}

function daysBetween(from?: string, to?: string) {
  if (!from || !to) {
    return null;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  return Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())
    ? null
    : Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function reservationAgeDays(item: InventoryItem) {
  const rawDate = item.reserveDate || item.contractDate || item.createDate;
  const date = new Date(rawDate);
  return !rawDate || Number.isNaN(date.getTime())
    ? 0
    : Math.floor((Date.now() - date.getTime()) / 86_400_000);
}
