"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DonutChartCard } from "@/components/charts/DonutChartCard/DonutChartCard";
import { StackedBarChartCard } from "@/components/charts/StackedBarChartCard/StackedBarChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber, formatValue } from "@/lib/apiClient";
import { coverageByModel, groupStockCoverage } from "@/lib/chartMetrics";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { StockCoverageItem } from "@/types/inventory";

export default function StockCoveragePage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getStockCoverage(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const coverageStatusChart = useMemo(() => groupStockCoverage(rows), [rows]);
  const coverageByModelChart = useMemo(() => coverageByModel(rows, 10), [rows]);
  const stockVsSalesChart = useMemo(() => rows.slice().sort((left, right) => right.currentStock - left.currentStock).slice(0, 10).map((row) => ({ name: row.model, stock: row.currentStock, sales: row.averageMonthlySales })), [rows]);
  const riskModelsChart = useMemo(() => rows.filter((row) => row.status === "danger" || row.status === "overstock").slice(0, 10).map((row) => ({ name: row.model, value: row.currentStock })), [rows]);
  const columns: DataTableColumn<StockCoverageItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    { key: "current", header: t("table.currentStock"), render: (row) => formatNumber(row.currentStock) },
    { key: "sold90", header: t("table.soldLast90Days"), render: (row) => formatNumber(row.soldLast90Days) },
    { key: "target", header: t("table.targetCoverageMonths"), render: (row) => formatNumber(row.targetCoverageMonths) },
    { key: "coverage", header: t("table.coverage"), render: (row) => formatValue(row.coverageMonths) },
    { key: "status", header: t("table.status"), render: (row) => <StatusBadge tone={row.status === "danger" ? "critical" : row.status === "overstock" ? "warning" : "success"}>{row.status}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader title={t("pages.stockCoverage.title")} description={t("pages.stockCoverage.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("stock-coverage.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("stock-coverage.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("stock-coverage.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <ChartGrid>
        <DonutChartCard title={t("charts.coverageStatus")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(rows.filter((row) => row.status === "danger").length)} danger`} data={coverageStatusChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.coverageByModel")} subtitle={t("charts.top10")} insight={`${formatNumber(coverageByModelChart[0]?.value ?? 0)} ${t("summary.months")}`} data={coverageByModelChart} isLoading={inventoryData.isInitialLoading} />
        <StackedBarChartCard title={t("charts.stockVsReorderPoint")} subtitle={t("charts.top10")} insight={t("charts.liveFilteredData")} data={stockVsSalesChart} keys={["stock", "sales"]} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.stockHealth")} subtitle={t("charts.top10")} insight={`${formatNumber(riskModelsChart.length)} ${t("table.model")}`} data={riskModelsChart} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.coverageByModel")} eyebrow={t("sections.inventoryPlanning")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



