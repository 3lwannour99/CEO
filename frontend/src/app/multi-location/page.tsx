"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { StackedBarChartCard } from "@/components/charts/StackedBarChartCard/StackedBarChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber, formatValue } from "@/lib/apiClient";
import { stackedKeys, type StackedChartDatum } from "@/lib/chartMetrics";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { LocationStock, RebalancingRecommendation } from "@/types/inventory";

export default function MultiLocationPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getMultiLocation(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const stockByCountry = useMemo(() => {
    const totals = new Map<string, number>();
    rows.stockByLocation.forEach((row) => {
      const key = row.country || row.sourceName || "Unknown";
      totals.set(key, (totals.get(key) ?? 0) + (row.currentStock ?? row.available ?? 0));
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value).slice(0, 10);
  }, [rows.stockByLocation]);
  const stockByWarehouse = useMemo(() => {
    const totals = new Map<string, number>();
    rows.stockByLocation.forEach((row) => {
      const key = row.warehouse || "Unknown";
      totals.set(key, (totals.get(key) ?? 0) + (row.currentStock ?? row.available ?? 0));
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value).slice(0, 10);
  }, [rows.stockByLocation]);
  const brandByLocation = useMemo<StackedChartDatum[]>(() => {
    const locations = new Map<string, Record<string, number>>();
    rows.stockByLocation.forEach((row) => {
      const location = row.warehouse || row.branch || row.sourceName || "Unknown";
      const brand = row.brand || "Unknown";
      const current = locations.get(location) ?? {};
      current[brand] = (current[brand] ?? 0) + (row.currentStock ?? row.available ?? 0);
      locations.set(location, current);
    });
    return Array.from(locations, ([name, values]) => ({ name, ...values })).slice(0, 10);
  }, [rows.stockByLocation]);
  const brandByLocationKeys = useMemo(() => stackedKeys(brandByLocation, 6), [brandByLocation]);
  const rebalancingChart = useMemo(() => rows.rebalancingRecommendations.map((row) => ({ name: `${row.fromWarehouse} → ${row.toWarehouse}`, value: row.suggestedTransferQuantity })).slice(0, 10), [rows.rebalancingRecommendations]);
  const columns: DataTableColumn<LocationStock>[] = [
    { key: "source", header: t("table.source"), render: (row) => formatValue(row.sourceName) },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "color", header: t("table.color"), render: (row) => formatValue(row.exteriorColor) },
    { key: "current", header: t("table.currentStock"), render: (row) => formatNumber(row.currentStock) },
  ];
  const transferColumns: DataTableColumn<RebalancingRecommendation>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "color", header: t("table.color"), render: (row) => formatValue(row.exteriorColor) },
    { key: "from", header: t("table.fromWarehouse"), render: (row) => formatValue(row.fromWarehouse) },
    { key: "to", header: t("table.toWarehouse"), render: (row) => formatValue(row.toWarehouse) },
    { key: "quantity", header: t("table.suggestedTransfer"), render: (row) => formatNumber(row.suggestedTransferQuantity) },
  ];

  return (
    <>
      <PageHeader title={t("pages.multiLocation.title")} description={t("pages.multiLocation.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("multi-location.xls", rows.stockByLocation)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("multi-location.csv", rows.stockByLocation)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("multi-location.pdf", rows.stockByLocation)}>{t("actions.exportPdf")}</button>
      </div>
      <ChartGrid>
        <BarChartCard title={t("charts.stockByCountry")} subtitle={t("charts.top10")} insight={`${formatNumber(stockByCountry[0]?.value ?? 0)} ${stockByCountry[0]?.name ?? ""}`} data={stockByCountry} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.stockByWarehouse")} subtitle={t("charts.top10")} insight={`${formatNumber(stockByWarehouse[0]?.value ?? 0)} ${stockByWarehouse[0]?.name ?? ""}`} data={stockByWarehouse} isLoading={inventoryData.isInitialLoading} />
        <StackedBarChartCard title={t("charts.stockByCompany")} subtitle={t("charts.liveFilteredData")} insight={t("charts.top10")} data={brandByLocation} keys={brandByLocationKeys} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.rebalancingOpportunities")} subtitle={t("charts.top10")} insight={`${formatNumber(rebalancingChart[0]?.value ?? 0)} ${t("table.suggestedTransfer")}`} data={rebalancingChart} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.branchStockMatrix")} eyebrow={t("sections.locations")}>
        <DataTable columns={columns} rows={rows.stockByLocation} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.stockRebalancing")} eyebrow={t("sections.transferTracking")}>
        <DataTable columns={transferColumns} rows={rows.rebalancingRecommendations} isLoading={inventoryData.isInitialLoading} emptyMessage={rows.transferTrackingMessage} />
      </SectionCard>
    </>
  );
}



