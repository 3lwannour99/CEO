import type { InventoryItem } from "@/types/inventory";
import { createMoneyTotals, divideMoneyTotals, sumMoney, type MoneyTotals } from "@/lib/currency";
import { classifyTransaction, isReservationTransaction } from "@/lib/transactionClassification";

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
  reservedUnits: number;
  externalReservedUnits: number;
  internalReservedUnits: number;
  soldRevenue: MoneyTotals;
  externalRevenue: MoneyTotals;
  internalRevenue: MoneyTotals;
  reservationValue: MoneyTotals;
  externalReservationValue: MoneyTotals;
  internalReservationValue: MoneyTotals;
  averageSoldPrice: MoneyTotals;
  averageReservationValue: MoneyTotals;
  retailSalesCount: number;
  brokersSalesCount: number;
  fleetSalesCount: number;
  bankSalesCount: number;
  retailReservationsCount: number;
  brokersReservationsCount: number;
  fleetReservationsCount: number;
  bankReservationsCount: number;
  reserveCount: number;
  contractCount: number;
  cessionCount: number;
  companyReservationCount: number;
  topSoldModels: CountBreakdown[];
  topSoldBrands: CountBreakdown[];
  topSoldColors: CountBreakdown[];
  topSoldBranches: CountBreakdown[];
  topCustomerGroups: CountBreakdown[];
  topReservedModels: CountBreakdown[];
  topReservedBrands: CountBreakdown[];
  topReservedColors: CountBreakdown[];
  topReservedBranches: CountBreakdown[];
  topReservationCustomerGroups: CountBreakdown[];
  missingModels: CountBreakdown[];
  missingBrands: CountBreakdown[];
  missingColors: CountBreakdown[];
  firstSaleDate: string;
  lastSaleDate: string;
  firstReservationDate: string;
  lastReservationDate: string;
  averageDaysToSell: number | null;
  shareOfTotalSales: number;
  shareOfExternalSales: number;
  shareOfTotalRevenue: number;
  shareOfTotalReservations: number;
  shareOfExternalReservations: number;
  shareOfTotalReservationValue: number;
}

export interface SalesmenKpiReport {
  salesmen: SalesmanKpi[];
  totalSalesmen: number;
  totalSoldUnits: number;
  externalSoldUnits: number;
  internalSoldUnits: number;
  totalReservedUnits: number;
  externalReservedUnits: number;
  internalReservedUnits: number;
  reserveUnits: number;
  contractUnits: number;
  cessionUnits: number;
  companyReservationUnits: number;
  totalRevenue: MoneyTotals;
  externalRevenue: MoneyTotals;
  internalRevenue: MoneyTotals;
  totalReservationValue: MoneyTotals;
  externalReservationValue: MoneyTotals;
  internalReservationValue: MoneyTotals;
  averageSalesPerSalesman: number;
  averageReservationsPerSalesman: number;
  topSalesmanByUnits: string;
  topSalesmanByRevenue: string;
  topSalesmanByReservations: string;
  topSalesmanByReservationValue: string;
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

function reservationItem(item: InventoryItem) {
  return isReservationTransaction(item);
}

function normalizedStatus(item: InventoryItem) {
  return String(item.normalizedStatus ?? "").trim();
}

function reservationDate(item: InventoryItem) {
  return parseDate(item.reserveDate) ?? parseDate(item.contractDate) ?? parseDate(item.createDate);
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

function reservationDateBounds(items: InventoryItem[]) {
  const dates = items.map(reservationDate).filter((date): date is Date => date !== null).sort((a, b) => a.getTime() - b.getTime());

  return {
    firstReservationDate: dates[0]?.toISOString() ?? "",
    lastReservationDate: dates[dates.length - 1]?.toISOString() ?? "",
  };
}

function statusCount(items: InventoryItem[], status: string) {
  return items.reduce((sum, item) => sum + (normalizedStatus(item) === status ? quantity(item) : 0), 0);
}

function missingBreakdown(overall: CountBreakdown[], group: InventoryItem[], selector: (item: InventoryItem) => string) {
  const soldLabels = new Set(group.map((item) => selector(item).trim() || "Unknown"));
  return overall.filter((item) => !soldLabels.has(item.label)).slice(0, 10);
}

export function calculateSalesmenKpi(items: InventoryItem[]): SalesmenKpiReport {
  const sold = items.filter(soldItem);
  const externalSold = sold.filter(externalSale);
  const internalSold = sold.filter(internalSale);
  const reserved = items.filter(reservationItem);
  const externalReserved = reserved.filter(externalSale);
  const internalReserved = reserved.filter(internalSale);
  const totalSoldUnits = sold.reduce((sum, item) => sum + quantity(item), 0);
  const externalSoldUnits = externalSold.reduce((sum, item) => sum + quantity(item), 0);
  const internalSoldUnits = internalSold.reduce((sum, item) => sum + quantity(item), 0);
  const totalReservedUnits = reserved.reduce((sum, item) => sum + quantity(item), 0);
  const externalReservedUnits = externalReserved.reduce((sum, item) => sum + quantity(item), 0);
  const internalReservedUnits = internalReserved.reduce((sum, item) => sum + quantity(item), 0);
  const totalRevenue = sumMoney(sold, (item) => item.soldPrice);
  const externalRevenue = sumMoney(externalSold, (item) => item.soldPrice);
  const internalRevenue = sumMoney(internalSold, (item) => item.soldPrice);
  const totalReservationValue = sumMoney(reserved, (item) => item.soldPrice);
  const externalReservationValue = sumMoney(externalReserved, (item) => item.soldPrice);
  const internalReservationValue = sumMoney(internalReserved, (item) => item.soldPrice);
  const overallModels = opportunityCounts(externalSold, (item) => item.model, 10);
  const overallBrands = opportunityCounts(externalSold, (item) => item.brand, 10);
  const overallColors = opportunityCounts(externalSold, (item) => item.exteriorColor, 10);
  const salesmanItems = items.filter((item) => soldItem(item) || reservationItem(item));
  const groups = salesmanItems.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const salesman = salesmanLabel(item.salesMan);
    acc[salesman] = acc[salesman] ?? [];
    acc[salesman].push(item);
    return acc;
  }, {});

  const salesmen = Object.entries(groups)
    .map(([salesman, group]): SalesmanKpi => {
      const soldGroup = group.filter(soldItem);
      const reservedGroup = group.filter(reservationItem);
      const soldUnits = soldGroup.reduce((sum, item) => sum + quantity(item), 0);
      const reservedUnits = reservedGroup.reduce((sum, item) => sum + quantity(item), 0);
      const externalGroup = soldGroup.filter(externalSale);
      const internalGroup = soldGroup.filter(internalSale);
      const externalReservationGroup = reservedGroup.filter(externalSale);
      const internalReservationGroup = reservedGroup.filter(internalSale);
      const externalGroupUnits = externalGroup.reduce((sum, item) => sum + quantity(item), 0);
      const externalReservationGroupUnits = externalReservationGroup.reduce((sum, item) => sum + quantity(item), 0);
      const soldRevenue = sumMoney(soldGroup, (item) => item.soldPrice);
      const externalGroupRevenue = sumMoney(externalGroup, (item) => item.soldPrice);
      const internalGroupRevenue = sumMoney(internalGroup, (item) => item.soldPrice);
      const reservationValue = sumMoney(reservedGroup, (item) => item.soldPrice);
      const externalReservationGroupValue = sumMoney(externalReservationGroup, (item) => item.soldPrice);
      const internalReservationGroupValue = sumMoney(internalReservationGroup, (item) => item.soldPrice);
      const topSoldModels = groupCounts(externalGroup, (item) => item.model);
      const topSoldBrands = groupCounts(externalGroup, (item) => item.brand);
      const topSoldColors = groupCounts(externalGroup, (item) => item.exteriorColor);
      const dates = saleDateBounds(externalGroup);
      const reservationDates = reservationDateBounds(externalReservationGroup);

      return {
        salesman,
        soldUnits,
        externalSoldUnits: externalGroupUnits,
        internalSoldUnits: internalGroup.reduce((sum, item) => sum + quantity(item), 0),
        reservedUnits,
        externalReservedUnits: externalReservationGroupUnits,
        internalReservedUnits: internalReservationGroup.reduce((sum, item) => sum + quantity(item), 0),
        soldRevenue,
        externalRevenue: externalGroupRevenue,
        internalRevenue: internalGroupRevenue,
        reservationValue,
        externalReservationValue: externalReservationGroupValue,
        internalReservationValue: internalReservationGroupValue,
        averageSoldPrice: externalGroupUnits > 0 ? divideMoneyTotals(externalGroupRevenue, externalGroupUnits) : createMoneyTotals(),
        averageReservationValue: externalReservationGroupUnits > 0 ? divideMoneyTotals(externalReservationGroupValue, externalReservationGroupUnits) : createMoneyTotals(),
        retailSalesCount: customerGroupCount(externalGroup, (value) => value.includes("retail") || value.includes("individual")),
        brokersSalesCount: customerGroupCount(externalGroup, (value) => value.includes("broker")),
        fleetSalesCount: customerGroupCount(externalGroup, (value) => value.includes("fleet")),
        bankSalesCount: customerGroupCount(externalGroup, (value) => value.includes("bank")),
        retailReservationsCount: customerGroupCount(externalReservationGroup, (value) => value.includes("retail") || value.includes("individual")),
        brokersReservationsCount: customerGroupCount(externalReservationGroup, (value) => value.includes("broker")),
        fleetReservationsCount: customerGroupCount(externalReservationGroup, (value) => value.includes("fleet")),
        bankReservationsCount: customerGroupCount(externalReservationGroup, (value) => value.includes("bank")),
        reserveCount: statusCount(reservedGroup, "reserve"),
        contractCount: statusCount(reservedGroup, "contract"),
        cessionCount: statusCount(reservedGroup, "cession"),
        companyReservationCount: statusCount(reservedGroup, "reservationForCompanies"),
        topSoldModels,
        topSoldBrands,
        topSoldColors,
        topSoldBranches: groupCounts(externalGroup, (item) => item.branch),
        topCustomerGroups: groupCounts(soldGroup, (item) => item.customerGroup),
        topReservedModels: groupCounts(externalReservationGroup, (item) => item.model),
        topReservedBrands: groupCounts(externalReservationGroup, (item) => item.brand),
        topReservedColors: groupCounts(externalReservationGroup, (item) => item.exteriorColor),
        topReservedBranches: groupCounts(externalReservationGroup, (item) => item.branch),
        topReservationCustomerGroups: groupCounts(reservedGroup, (item) => item.customerGroup),
        missingModels: missingBreakdown(overallModels, externalGroup, (item) => item.model),
        missingBrands: missingBreakdown(overallBrands, externalGroup, (item) => item.brand),
        missingColors: missingBreakdown(overallColors, externalGroup, (item) => item.exteriorColor),
        firstSaleDate: dates.firstSaleDate,
        lastSaleDate: dates.lastSaleDate,
        firstReservationDate: reservationDates.firstReservationDate,
        lastReservationDate: reservationDates.lastReservationDate,
        averageDaysToSell: averageDaysToSell(soldGroup),
        shareOfTotalSales: totalSoldUnits > 0 ? (soldUnits / totalSoldUnits) * 100 : 0,
        shareOfExternalSales: externalSoldUnits > 0 ? (externalGroupUnits / externalSoldUnits) * 100 : 0,
        shareOfTotalRevenue: totalRevenue.usd > 0 ? (soldRevenue.usd / totalRevenue.usd) * 100 : 0,
        shareOfTotalReservations: totalReservedUnits > 0 ? (reservedUnits / totalReservedUnits) * 100 : 0,
        shareOfExternalReservations: externalReservedUnits > 0 ? (externalReservationGroupUnits / externalReservedUnits) * 100 : 0,
        shareOfTotalReservationValue: totalReservationValue.usd > 0 ? (reservationValue.usd / totalReservationValue.usd) * 100 : 0,
      };
    })
    .sort((a, b) => b.externalSoldUnits - a.externalSoldUnits || b.externalReservedUnits - a.externalReservedUnits || b.externalRevenue.usd - a.externalRevenue.usd);

  const assignedSalesmen = salesmen.filter((salesman) => assignedSalesman(salesman.salesman));
  return {
    salesmen,
    totalSalesmen: assignedSalesmen.length,
    totalSoldUnits,
    externalSoldUnits,
    internalSoldUnits,
    totalReservedUnits,
    externalReservedUnits,
    internalReservedUnits,
    reserveUnits: statusCount(reserved, "reserve"),
    contractUnits: statusCount(reserved, "contract"),
    cessionUnits: statusCount(reserved, "cession"),
    companyReservationUnits: statusCount(reserved, "reservationForCompanies"),
    totalRevenue,
    externalRevenue,
    internalRevenue,
    totalReservationValue,
    externalReservationValue,
    internalReservationValue,
    averageSalesPerSalesman: assignedSalesmen.length > 0 ? assignedSalesmen.reduce((sum, salesman) => sum + salesman.externalSoldUnits, 0) / assignedSalesmen.length : 0,
    averageReservationsPerSalesman: assignedSalesmen.length > 0 ? assignedSalesmen.reduce((sum, salesman) => sum + salesman.externalReservedUnits, 0) / assignedSalesmen.length : 0,
    topSalesmanByUnits: assignedSalesmen[0]?.salesman ?? "-",
    topSalesmanByRevenue: [...assignedSalesmen].sort((a, b) => b.externalRevenue.usd - a.externalRevenue.usd)[0]?.salesman ?? "-",
    topSalesmanByReservations: [...assignedSalesmen].sort((a, b) => b.externalReservedUnits - a.externalReservedUnits)[0]?.salesman ?? "-",
    topSalesmanByReservationValue: [...assignedSalesmen].sort((a, b) => b.externalReservationValue.usd - a.externalReservationValue.usd)[0]?.salesman ?? "-",
  };
}
