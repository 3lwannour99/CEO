import type { InventoryItem } from "@/types/inventory";
import { createMoneyTotals, divideMoneyTotals, sumMoney, type MoneyTotals } from "@/lib/currency";
import { classifyTransaction } from "@/lib/transactionClassification";

const UNASSIGNED_SALESMAN = "Unassigned";

export interface CountBreakdown {
  label: string;
  count: number;
  revenueOpportunity?: MoneyTotals;
  salesmenCount?: number;
  soldUnits?: number;
}

export interface SalesmanKpi {
  salesman: string;
  soldUnits: number;
  externalSoldUnits: number;
  internalSoldUnits: number;
  soldRevenue: MoneyTotals;
  externalRevenue: MoneyTotals;
  internalRevenue: MoneyTotals;
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
  shareOfExternalSales: number;
  shareOfTotalRevenue: number;
}

export interface SalesmenKpiReport {
  salesmen: SalesmanKpi[];
  totalSalesmen: number;
  totalSoldUnits: number;
  externalSoldUnits: number;
  internalSoldUnits: number;
  totalRevenue: MoneyTotals;
  externalRevenue: MoneyTotals;
  internalRevenue: MoneyTotals;
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

function salesmanLabel(value: string) {
  return validSalesman(value) ? value.trim() : UNASSIGNED_SALESMAN;
}

function assignedSalesman(value: string) {
  return value !== UNASSIGNED_SALESMAN && validSalesman(value);
}

function soldItem(item: InventoryItem) {
  return item.normalizedStatus === "sold" || item.isSold;
}

function externalSale(item: InventoryItem) {
  return classifyTransaction(item) === "external";
}

function internalSale(item: InventoryItem) {
  return classifyTransaction(item) === "internal";
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

function opportunityCounts(items: InventoryItem[], selector: (item: InventoryItem) => string, limit = 10): CountBreakdown[] {
  const groups = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const label = selector(item).trim() || "Unknown";
    acc[label] = acc[label] ?? [];
    acc[label].push(item);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([label, group]) => ({
      label,
      count: group.reduce((sum, item) => sum + quantity(item), 0),
      revenueOpportunity: sumMoney(group, (item) => item.soldPrice),
      salesmenCount: new Set(group.map((item) => item.salesMan.trim()).filter(validSalesman)).size,
      soldUnits: 0,
    }))
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

function missingBreakdown(overall: CountBreakdown[], group: InventoryItem[], selector: (item: InventoryItem) => string) {
  const soldLabels = new Set(group.map((item) => selector(item).trim() || "Unknown"));
  return overall.filter((item) => !soldLabels.has(item.label)).slice(0, 10);
}

export function calculateSalesmenKpi(items: InventoryItem[]): SalesmenKpiReport {
  const sold = items.filter(soldItem);
  const externalSold = sold.filter(externalSale);
  const internalSold = sold.filter(internalSale);
  const totalSoldUnits = sold.reduce((sum, item) => sum + quantity(item), 0);
  const externalSoldUnits = externalSold.reduce((sum, item) => sum + quantity(item), 0);
  const internalSoldUnits = internalSold.reduce((sum, item) => sum + quantity(item), 0);
  const totalRevenue = sumMoney(sold, (item) => item.soldPrice);
  const externalRevenue = sumMoney(externalSold, (item) => item.soldPrice);
  const internalRevenue = sumMoney(internalSold, (item) => item.soldPrice);
  const overallModels = opportunityCounts(externalSold, (item) => item.model, 10);
  const overallBrands = opportunityCounts(externalSold, (item) => item.brand, 10);
  const overallColors = opportunityCounts(externalSold, (item) => item.exteriorColor, 10);
  const groups = sold.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const salesman = salesmanLabel(item.salesMan);
    acc[salesman] = acc[salesman] ?? [];
    acc[salesman].push(item);
    return acc;
  }, {});

  const salesmen = Object.entries(groups)
    .map(([salesman, group]): SalesmanKpi => {
      const soldUnits = group.reduce((sum, item) => sum + quantity(item), 0);
      const externalGroup = group.filter(externalSale);
      const internalGroup = group.filter(internalSale);
      const externalGroupUnits = externalGroup.reduce((sum, item) => sum + quantity(item), 0);
      const soldRevenue = sumMoney(group, (item) => item.soldPrice);
      const externalGroupRevenue = sumMoney(externalGroup, (item) => item.soldPrice);
      const internalGroupRevenue = sumMoney(internalGroup, (item) => item.soldPrice);
      const topSoldModels = groupCounts(externalGroup, (item) => item.model);
      const topSoldBrands = groupCounts(externalGroup, (item) => item.brand);
      const topSoldColors = groupCounts(externalGroup, (item) => item.exteriorColor);
      const dates = saleDateBounds(externalGroup);

      return {
        salesman,
        soldUnits,
        externalSoldUnits: externalGroupUnits,
        internalSoldUnits: internalGroup.reduce((sum, item) => sum + quantity(item), 0),
        soldRevenue,
        externalRevenue: externalGroupRevenue,
        internalRevenue: internalGroupRevenue,
        averageSoldPrice: externalGroupUnits > 0 ? divideMoneyTotals(externalGroupRevenue, externalGroupUnits) : createMoneyTotals(),
        retailSalesCount: customerGroupCount(externalGroup, (value) => value.includes("retail") || value.includes("individual")),
        brokersSalesCount: customerGroupCount(externalGroup, (value) => value.includes("broker")),
        fleetSalesCount: customerGroupCount(externalGroup, (value) => value.includes("fleet")),
        bankSalesCount: customerGroupCount(externalGroup, (value) => value.includes("bank")),
        topSoldModels,
        topSoldBrands,
        topSoldColors,
        topSoldBranches: groupCounts(externalGroup, (item) => item.branch),
        topCustomerGroups: groupCounts(group, (item) => item.customerGroup),
        missingModels: missingBreakdown(overallModels, externalGroup, (item) => item.model),
        missingBrands: missingBreakdown(overallBrands, externalGroup, (item) => item.brand),
        missingColors: missingBreakdown(overallColors, externalGroup, (item) => item.exteriorColor),
        firstSaleDate: dates.firstSaleDate,
        lastSaleDate: dates.lastSaleDate,
        averageDaysToSell: averageDaysToSell(group),
        shareOfTotalSales: totalSoldUnits > 0 ? (soldUnits / totalSoldUnits) * 100 : 0,
        shareOfExternalSales: externalSoldUnits > 0 ? (externalGroupUnits / externalSoldUnits) * 100 : 0,
        shareOfTotalRevenue: totalRevenue.usd > 0 ? (soldRevenue.usd / totalRevenue.usd) * 100 : 0,
      };
    })
    .sort((a, b) => b.externalSoldUnits - a.externalSoldUnits || b.externalRevenue.usd - a.externalRevenue.usd);

  const assignedSalesmen = salesmen.filter((salesman) => assignedSalesman(salesman.salesman));
  return {
    salesmen,
    totalSalesmen: assignedSalesmen.length,
    totalSoldUnits,
    externalSoldUnits,
    internalSoldUnits,
    totalRevenue,
    externalRevenue,
    internalRevenue,
    averageSalesPerSalesman: assignedSalesmen.length > 0 ? assignedSalesmen.reduce((sum, salesman) => sum + salesman.externalSoldUnits, 0) / assignedSalesmen.length : 0,
    topSalesmanByUnits: assignedSalesmen[0]?.salesman ?? "-",
    topSalesmanByRevenue: [...assignedSalesmen].sort((a, b) => b.externalRevenue.usd - a.externalRevenue.usd)[0]?.salesman ?? "-",
  };
}
