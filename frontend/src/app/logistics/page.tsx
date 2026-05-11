"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DonutChartCard } from "@/components/charts/DonutChartCard/DonutChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard/LineChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatDate, formatNumber, formatValue } from "@/lib/apiClient";
import { delayedShipmentsBySource, groupLogisticsStatus, logisticsCycleBySource } from "@/lib/chartMetrics";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { LogisticsStatus } from "@/types/inventory";

export default function LogisticsPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getLogistics(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const statusChart = useMemo(() => groupLogisticsStatus(rows), [rows]);
  const cycleChart = useMemo(() => logisticsCycleBySource(rows, 10), [rows]);
  const delayedChart = useMemo(() => delayedShipmentsBySource(rows, 10), [rows]);
  const arrivalsChart = useMemo(() => {
    const totals = new Map<string, number>();
    rows.forEach((row) => {
      const month = (row.estimatedArrival ?? row.eta ?? "").match(/^(\d{4})-(\d{2})/)?.[0];
      if (!month) return;
      totals.set(month, (totals.get(month) ?? 0) + (row.units || 1));
    });
    return Array.from(totals, ([name, arrivals]) => ({ name, arrivals })).sort((left, right) => left.name.localeCompare(right.name)).slice(0, 12);
  }, [rows]);
  const columns: DataTableColumn<LogisticsStatus>[] = [
    { key: "po", header: t("table.poNo"), render: (row) => formatValue(row.poNo) },
    { key: "source", header: t("table.source"), render: (row) => formatValue(row.sourceName) },
    { key: "status", header: t("table.status"), render: (row) => row.status },
    { key: "eta", header: t("table.eta"), render: (row) => formatDate(row.estimatedArrival ?? row.eta) },
    { key: "cycle", header: t("table.cycleTimeDays"), render: (row) => formatValue(row.cycleTimeDays) },
    { key: "delay", header: t("table.supplierDelayDays"), render: (row) => formatValue(row.supplierDelayDays) },
    { key: "branch", header: t("table.destination"), render: (row) => formatValue(row.branch) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.units) },
  ];

  return (
    <>
      <PageHeader title={t("pages.logistics.title")} description={t("pages.logistics.description")} />
      <FilterBar compact filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("logistics.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("logistics.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("logistics.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <ChartGrid>
        <DonutChartCard title={t("charts.logisticsStatus")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(rows.length)} ${t("sections.inboundOperations")}`} data={statusChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.cycleTimeBySource")} subtitle={t("charts.top10")} insight={`${formatNumber(cycleChart[0]?.value ?? 0)} ${t("table.days")}`} data={cycleChart} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.delayedShipments")} subtitle={t("charts.top10")} insight={`${formatNumber(delayedChart[0]?.value ?? 0)} ${delayedChart[0]?.name ?? ""}`} data={delayedChart} isLoading={inventoryData.isInitialLoading} />
        <LineChartCard title={t("table.eta")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(arrivalsChart.reduce((sum, row) => sum + Number(row.arrivals), 0))} ${t("table.units")}`} data={arrivalsChart} keys={["arrivals"]} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.logisticsStatus")} eyebrow={t("sections.inboundOperations")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



