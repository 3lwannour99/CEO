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
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { aggregatedByWarehouse, aggregatedColorDistribution, aggregatedTypeColor, stackedKeys } from "@/lib/chartMetrics";
import { formatNumber } from "@/lib/apiClient";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { AggregatedStockItem } from "@/types/inventory";

export default function AggregatedStockPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getAggregatedStock(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const typeColorChart = useMemo(() => aggregatedTypeColor(rows.byTypeColor, 10), [rows.byTypeColor]);
  const typeColorKeys = useMemo(() => stackedKeys(typeColorChart, 6), [typeColorChart]);
  const warehouseChart = useMemo(() => aggregatedByWarehouse(rows.byWarehouseTypeColor, 10), [rows.byWarehouseTypeColor]);
  const colorDistribution = useMemo(() => aggregatedColorDistribution(rows.byModelColor, 10), [rows.byModelColor]);
  const modelStockChart = useMemo(() => rows.byModelColor.map((row) => ({ name: row.model, value: row.units })).sort((left, right) => right.value - left.value).slice(0, 10), [rows.byModelColor]);
  const columns: DataTableColumn<AggregatedStockItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "type", header: t("table.type"), render: (row) => row.type ?? "" },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => row.warehouse ?? "" },
    { key: "color", header: t("table.exterior"), render: (row) => row.exteriorColor },
    { key: "units", header: t("table.totalUnits"), render: (row) => formatNumber(row.units) },
  ];

  return (
    <>
      <PageHeader title={t("pages.aggregatedStock.title")} description={t("pages.aggregatedStock.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("aggregated-stock.xls", rows.byModelColor)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("aggregated-stock.csv", rows.byModelColor)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("aggregated-stock.pdf", rows.byModelColor)}>{t("actions.exportPdf")}</button>
      </div>
      <ChartGrid>
        <StackedBarChartCard title={t("charts.stockByTypeColor")} subtitle={t("charts.top10")} insight={t("charts.liveFilteredData")} data={typeColorChart} keys={typeColorKeys} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.topModelsByUnits")} subtitle={t("charts.top10")} insight={`${formatNumber(modelStockChart[0]?.value ?? 0)} ${modelStockChart[0]?.name ?? ""}`} data={modelStockChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.stockByWarehouse")} subtitle={t("charts.top10")} insight={`${formatNumber(warehouseChart[0]?.value ?? 0)} ${warehouseChart[0]?.name ?? ""}`} data={warehouseChart} isLoading={inventoryData.isInitialLoading} />
        <DonutChartCard title={t("charts.colorDistribution")} subtitle={t("charts.top10")} insight={`${colorDistribution[0]?.name ?? ""}`} data={colorDistribution} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.byModelColor")} eyebrow={t("sections.stockRollup")}>
        <DataTable columns={columns.filter((column) => column.key !== "warehouse")} rows={rows.byModelColor} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.byTypeColor")} eyebrow={t("sections.stockRollup")}>
        <DataTable columns={columns.filter((column) => column.key !== "brand" && column.key !== "model" && column.key !== "warehouse")} rows={rows.byTypeColor} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.byWarehouseTypeColor")} eyebrow={t("sections.stockRollup")}>
        <DataTable columns={columns.filter((column) => column.key !== "brand" && column.key !== "model")} rows={rows.byWarehouseTypeColor} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}

