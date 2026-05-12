"use client";

import { useMemo, useState } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { LineChartCard } from "@/components/charts/LineChartCard/LineChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber } from "@/lib/apiClient";
import { buildSalesRevenueTrendByDateFilter, groupSalesUnitsByDateFilter, salesItemsToBars } from "@/lib/chartMetrics";
import { formatCurrency, formatMoneyTotalsCompact } from "@/lib/currency";
import { exportCsv, exportExcel } from "@/lib/exportData";
import { calculateSalesPerformance } from "@/lib/reports/inventoryReports";
import { classifyTransaction } from "@/lib/transactionClassification";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type { SalesPerformanceItem } from "@/types/inventory";

type SalesMode = "all" | "external" | "internal";

export default function SalesPerformancePage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const [salesMode, setSalesMode] = useState<SalesMode>("external");
  const salesModeItems = useMemo(() => filterSalesByMode(filteredItems, salesMode), [filteredItems, salesMode]);
  const data = useMemo(() => calculateSalesPerformance(salesModeItems), [salesModeItems]);
  const comparisonData = useMemo(() => calculateSalesPerformance(filteredItems), [filteredItems]);
  const salesByMonth = useMemo(() => groupSalesUnitsByDateFilter(salesModeItems, filters), [salesModeItems, filters]);
  const salesRevenueByMonth = useMemo(() => buildSalesRevenueTrendByDateFilter(salesModeItems, filters), [salesModeItems, filters]);
  const revenueCurrencyKeys = useMemo(() => selectedCurrencies.map((currency) => currency.toLowerCase()), [selectedCurrencies]);
  const revenueLabels = useMemo(() => ({ sar: t("charts.revenueSar"), jod: t("charts.revenueJod"), usd: t("charts.revenueUsd") }), [t]);
  const latestRevenue = salesRevenueByMonth.at(-1);
  const primaryRevenueCurrency = selectedCurrencies[0] ?? "USD";
  const topSellingModelsChart = useMemo(() => salesItemsToBars(data.topSellingModels, 10), [data.topSellingModels]);
  const salesByColorChart = useMemo(() => (data.bestSellingColors ?? data.breakdownByColor).map((row) => ({ name: row.exteriorColor, value: row.unitsSold })).slice(0, 10), [data.bestSellingColors, data.breakdownByColor]);
  const salesByBranchChart = useMemo(() => data.breakdownByBranch.map((row) => ({ name: row.branch, value: row.unitsSold })).slice(0, 10), [data.breakdownByBranch]);
  const customerGroupRevenueChart = useMemo(() => {
    const totals = new Map<string, number>();
    salesModeItems.filter((item) => item.isSold).forEach((item) => {
      const key = item.customerGroup || "Unknown";
      totals.set(key, (totals.get(key) ?? 0) + (item.soldPrice || 0));
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value).slice(0, 10);
  }, [salesModeItems]);
  const sellThroughChart = useMemo(() => (data.breakdownByModelColor ?? data.breakdownByModel).map((row) => ({ name: row.model, value: row.sellThroughRate ?? 0 })).sort((left, right) => right.value - left.value).slice(0, 10), [data.breakdownByModel, data.breakdownByModelColor]);
  const columns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "type", header: t("table.type"), render: (row) => row.type ?? "" },
    { key: "units", header: t("table.unitsSold"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies) },
  ];
  const colorColumns: DataTableColumn<SalesPerformanceItem>[] = [
    ...columns.slice(0, 3),
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor ?? "" },
    ...columns.slice(3),
    { key: "averagePrice", header: t("currency.averagePrice"), render: (row) => row.averageSoldPrice ? formatMoneyTotalsCompact(row.averageSoldPrice, language, selectedCurrencies) : "-" },
    { key: "customerGroups", header: t("salesmenKpi.topCustomerGroups"), render: (row) => row.customerGroupBreakdown?.map((item) => `${item.customerGroup} (${formatNumber(item.unitsSold)})`).join(", ") ?? "-" },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch ?? "-" },
    { key: "source", header: t("table.source"), render: (row) => row.sourceName ?? "-" },
    { key: "sellThrough", header: t("table.sellThroughRate"), render: (row) => `${formatNumber(row.sellThroughRate)}%` },
    { key: "turnover", header: t("table.inventoryTurnover"), render: (row) => formatNumber(row.inventoryTurnover) },
  ];
  const sellingColorColumns: DataTableColumn<{ exteriorColor: string; unitsSold: number; revenue: SalesPerformanceItem["revenue"] }>[] = [
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    { key: "units", header: t("table.unitsSold"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies) },
  ];

  return (
    <>
      <PageHeader title={t("pages.salesPerformance.title")} description={t("pages.salesPerformance.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <section className="report-actions" aria-label={t("transaction.class")}>
        {[
          ["all", t("transaction.allSales")],
          ["external", t("transaction.externalSales")],
          ["internal", t("transaction.internalSales")],
        ].map(([value, label]) => (
          <button key={value} className={`report-button ${salesMode === value ? "primary" : ""}`} type="button" onClick={() => setSalesMode(value as SalesMode)}>
            {label}
          </button>
        ))}
      </section>
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("sales-performance.xls", data.breakdownByModel)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("sales-performance.csv", data.breakdownByModel)}>{t("actions.exportCsv")}</button>
      </div>
      <section className="report-actions" aria-label={t("sections.sales")}>
        <span>{t("transaction.totalSales")}: {formatNumber(comparisonData.soldUnitsTotal ?? 0)}</span>
        <span>{t("transaction.externalSales")}: {formatNumber(comparisonData.soldUnitsExternal ?? 0)}</span>
        <span>{t("transaction.internalSales")}: {formatNumber(comparisonData.soldUnitsInternal ?? 0)}</span>
        <span>{t("transaction.totalRevenue")}: {formatMoneyTotalsCompact(comparisonData.soldRevenueBreakdown?.total ?? comparisonData.soldRevenue, language, selectedCurrencies)}</span>
        <span>{t("transaction.externalRevenue")}: {formatMoneyTotalsCompact(comparisonData.soldRevenueBreakdown?.external ?? comparisonData.soldRevenue, language, selectedCurrencies)}</span>
        <span>{t("transaction.internalRevenue")}: {formatMoneyTotalsCompact(comparisonData.soldRevenueBreakdown?.internal ?? comparisonData.soldRevenue, language, selectedCurrencies)}</span>
        <span>{t("table.sellThroughRate")}: {formatNumber(data.sellThroughRate)}%</span>
        <span>{t("table.inventoryTurnover")}: {formatNumber(data.inventoryTurnover)}</span>
        <span>{t("table.averageMovement")}: {formatNumber(data.averageMovement)}</span>
      </section>
      <ChartGrid>
        <LineChartCard title={t("charts.salesUnitsTrend")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(data.sellThroughRate)}%`} data={salesByMonth} keys={["sold"]} isLoading={inventoryData.isInitialLoading} />
        <LineChartCard title={t("charts.salesRevenueTrend")} subtitle={t("charts.liveFilteredData")} insight={formatCurrency(getRevenueTrendValue(latestRevenue, primaryRevenueCurrency), primaryRevenueCurrency, language)} data={salesRevenueByMonth} keys={revenueCurrencyKeys} labels={revenueLabels} valueFormatter={(value, key) => formatRevenueTrendValue(value, key, language)} yAxisFormatter={(value) => formatCompactMoney(value, language)} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.topModelsByUnits")} subtitle={t("charts.top10")} insight={`${formatNumber(topSellingModelsChart[0]?.value ?? 0)} ${topSellingModelsChart[0]?.name ?? ""}`} data={topSellingModelsChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.salesByColor")} subtitle={t("charts.top10")} insight={`${formatNumber(salesByColorChart[0]?.value ?? 0)} ${salesByColorChart[0]?.name ?? ""}`} data={salesByColorChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.salesByBranch")} subtitle={t("charts.top10")} insight={`${formatNumber(salesByBranchChart[0]?.value ?? 0)} ${salesByBranchChart[0]?.name ?? ""}`} data={salesByBranchChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.customerGroupRevenue")} subtitle="USD" insight={`${formatNumber(customerGroupRevenueChart[0]?.value ?? 0)} USD`} data={customerGroupRevenueChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.sellThroughByModel")} subtitle={t("charts.top10")} insight={`${formatNumber(data.sellThroughRate)}%`} data={sellThroughChart} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.salesPerformanceTable")} eyebrow={t("sections.commercial")} action={t("sections.topSellingModels")}>
        <DataTable columns={columns} rows={data.topSellingModels} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.bottomSellingModels")} eyebrow={t("sections.commercial")}>
        <DataTable columns={columns} rows={data.lowestSellingModels} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.byModelAndColor")} eyebrow={t("sections.commercial")} action={formatNumber(data.breakdownByModelColor?.length ?? 0)}>
        <DataTable columns={colorColumns} rows={data.breakdownByModelColor ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.bestSellingColors")} eyebrow={t("sections.commercial")}>
        <DataTable columns={sellingColorColumns} rows={data.bestSellingColors ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.lowestSellingColors")} eyebrow={t("sections.commercial")}>
        <DataTable columns={sellingColorColumns} rows={data.lowestSellingColors ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}

function filterSalesByMode(items: import("@/types/inventory").InventoryItem[], mode: SalesMode) {
  if (mode === "all") {
    return items;
  }

  return items.filter((item) => {
    return classifyTransaction(item) === mode;
  });
}

function formatRevenueTrendValue(value: number, key: string, language: string) {
  const currency = key.toLowerCase().includes("sar") ? "SAR" : key.toLowerCase().includes("jod") ? "JOD" : "USD";
  return formatCurrency(value, currency, language);
}

function formatCompactMoney(value: number, language: string) {
  return new Intl.NumberFormat(language, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getRevenueTrendValue(row: { sar: number; jod: number; usd: number } | undefined, currency: "SAR" | "JOD" | "USD") {
  if (!row) {
    return 0;
  }

  return currency === "SAR" ? row.sar : currency === "JOD" ? row.jod : row.usd;
}

