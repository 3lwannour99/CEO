import type { InventoryItem } from "@/types/inventory";
import { createMoneyTotals, divideMoneyTotals, sumMoney, type MoneyTotals } from "@/lib/currency";

export interface CountBreakdown {
  label: string;
  count: number;
}

export interface SalesmanKpi {
  salesman: string;
  soldUnits: number;
  soldRevenue: MoneyTotals;
  averageSoldPrice: MoneyTotals;
  retailSalesCount: number;
  brokersSalesCount: number;
  fleetSalesCount: number;
  bankSalesCount: number;
  topSoldModels: CountBreakdown[];
  topSoldBrands: CountBreakdown[];
  topSoldColors: CountBreakdown[];
  topSoldBranches: CountBreakdown[];
  topCustomerGroups: CountBreakdown[];
  missingModels: CountBreakdown[];
  missingBrands: CountBreakdown[];
  missingColors: CountBreakdown[];
  firstSaleDate: string;
  lastSaleDate: string;
  averageDaysToSell: number | null;
  shareOfTotalSales: number;
  shareOfTotalRevenue: number;
}

export interface SalesmenKpiReport {
  salesmen: SalesmanKpi[];
  totalSalesmen: number;
  totalSoldUnits: number;
  totalRevenue: MoneyTotals;
  averageSalesPerSalesman: number;
  topSalesmanByUnits: string;
  topSalesmanByRevenue: string;
}

function quantity(item: InventoryItem) {
  return item.quantity || 1;
}

function validSalesman(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized && normalized !== "-no sales employee / buyer-";
}

function soldItem(item: InventoryItem) {
  return item.normalizedStatus === "sold" || item.isSold;
}

function groupCounts(items: InventoryItem[], selector: (item: InventoryItem) => string, limit = 5): CountBreakdown[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const label = selector(item).trim() || "Unknown";
    acc[label] = (acc[label] ?? 0) + quantity(item);
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function customerGroupCount(items: InventoryItem[], matcher: (value: string) => boolean) {
  return items.reduce((sum, item) => sum + (matcher(item.customerGroup.toLowerCase()) ? quantity(item) : 0), 0);
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stockDate(item: InventoryItem) {
  return parseDate(item.grpoDate) ?? parseDate(item.apInvoiceDate) ?? parseDate(item.createDate);
}

function saleDate(item: InventoryItem) {
  return parseDate(item.arInvoiceDate) ?? parseDate(item.contractDate) ?? parseDate(item.reserveDate);
}

function averageDaysToSell(items: InventoryItem[]) {
  const durations = items
    .map((item) => {
      const start = stockDate(item);
      const end = saleDate(item);
      if (!start || !end) {
        return null;
      }

      return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) {
    return null;
  }

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function saleDateBounds(items: InventoryItem[]) {
  const dates = items.map(saleDate).filter((date): date is Date => date !== null).sort((a, b) => a.getTime() - b.getTime());

  return {
    firstSaleDate: dates[0]?.toISOString() ?? "",
    lastSaleDate: dates[dates.length - 1]?.toISOString() ?? "",
  };
}

function missingBreakdown(overall: CountBreakdown[], salesmanValues: CountBreakdown[]) {
  const soldLabels = new Set(salesmanValues.map((item) => item.label));
  return overall.filter((item) => !soldLabels.has(item.label)).slice(0, 10);
}

export function calculateSalesmenKpi(items: InventoryItem[]): SalesmenKpiReport {
  const sold = items.filter((item) => soldItem(item) && validSalesman(item.salesMan));
  const totalSoldUnits = sold.reduce((sum, item) => sum + quantity(item), 0);
  const totalRevenue = sumMoney(sold, (item) => item.soldPrice);
  const overallModels = groupCounts(sold, (item) => item.model, 10);
  const overallBrands = groupCounts(sold, (item) => item.brand, 10);
  const overallColors = groupCounts(sold, (item) => item.exteriorColor, 10);
  const groups = sold.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const salesman = item.salesMan.trim();
    acc[salesman] = acc[salesman] ?? [];
    acc[salesman].push(item);
    return acc;
  }, {});

  const salesmen = Object.entries(groups)
    .map(([salesman, group]): SalesmanKpi => {
      const soldUnits = group.reduce((sum, item) => sum + quantity(item), 0);
      const soldRevenue = sumMoney(group, (item) => item.soldPrice);
      const topSoldModels = groupCounts(group, (item) => item.model);
      const topSoldBrands = groupCounts(group, (item) => item.brand);
      const topSoldColors = groupCounts(group, (item) => item.exteriorColor);
      const dates = saleDateBounds(group);

      return {
        salesman,
        soldUnits,
        soldRevenue,
        averageSoldPrice: soldUnits > 0 ? divideMoneyTotals(soldRevenue, soldUnits) : createMoneyTotals(),
        retailSalesCount: customerGroupCount(group, (value) => value.includes("retail") || value.includes("individual")),
        brokersSalesCount: customerGroupCount(group, (value) => value.includes("broker")),
        fleetSalesCount: customerGroupCount(group, (value) => value.includes("fleet")),
        bankSalesCount: customerGroupCount(group, (value) => value.includes("bank")),
        topSoldModels,
        topSoldBrands,
        topSoldColors,
        topSoldBranches: groupCounts(group, (item) => item.branch),
        topCustomerGroups: groupCounts(group, (item) => item.customerGroup),
        missingModels: missingBreakdown(overallModels, topSoldModels),
        missingBrands: missingBreakdown(overallBrands, topSoldBrands),
        missingColors: missingBreakdown(overallColors, topSoldColors),
        firstSaleDate: dates.firstSaleDate,
        lastSaleDate: dates.lastSaleDate,
        averageDaysToSell: averageDaysToSell(group),
        shareOfTotalSales: totalSoldUnits > 0 ? (soldUnits / totalSoldUnits) * 100 : 0,
        shareOfTotalRevenue: totalRevenue.usd > 0 ? (soldRevenue.usd / totalRevenue.usd) * 100 : 0,
      };
    })
    .sort((a, b) => b.soldUnits - a.soldUnits || b.soldRevenue.usd - a.soldRevenue.usd);

  return {
    salesmen,
    totalSalesmen: salesmen.length,
    totalSoldUnits,
    totalRevenue,
    averageSalesPerSalesman: salesmen.length > 0 ? totalSoldUnits / salesmen.length : 0,
    topSalesmanByUnits: salesmen[0]?.salesman ?? "-",
    topSalesmanByRevenue: [...salesmen].sort((a, b) => b.soldRevenue.usd - a.soldRevenue.usd)[0]?.salesman ?? "-",
  };
}
