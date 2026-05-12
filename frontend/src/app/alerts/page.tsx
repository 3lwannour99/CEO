"use client";

import { useMemo, useState } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DonutChartCard } from "@/components/charts/DonutChartCard/DonutChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatValue } from "@/lib/apiClient";
import { groupAlertsBySeverity, groupAlertsByType } from "@/lib/chartMetrics";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { classifyTransaction, transactionClassLabelKey } from "@/lib/transactionClassification";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryAlert, InventoryItem } from "@/types/inventory";

export default function AlertsPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const rows = useMemo(() => inventoryData.getAlerts(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const alertsBySeverity = useMemo(() => groupAlertsBySeverity(rows), [rows]);
  const alertsByType = useMemo(() => groupAlertsByType(rows, 10), [rows]);
  const alertCountsByType = useMemo(() => groupAlertsByType(rows.map((row) => ({ ...row, affectedUnits: 1, affectedCount: 1 })), 10), [rows]);
  const topAffectedModels = useMemo(() => {
    const totals = new Map<string, number>();
    rows.forEach((row) => {
      const key = row.model || row.brand || row.title;
      totals.set(key, (totals.get(key) ?? 0) + (row.affectedUnits ?? row.affectedCount ?? 1));
    });
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value).slice(0, 10);
  }, [rows]);
  const selectedAlert = rows.find((row) => row.id === selectedAlertId) ?? null;
  const columns: DataTableColumn<InventoryAlert>[] = [
    { key: "title", header: t("table.title"), render: (row) => row.title },
    { key: "message", header: t("table.message"), render: (row) => row.message },
    { key: "source", header: t("table.source"), render: (row) => formatValue(row.sourceName ?? row.branch) },
    { key: "brand", header: t("table.brand"), render: (row) => formatValue(row.brand) },
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "affected", header: t("alerts.affectedUnits"), render: (row) => formatValue(row.affectedUnits ?? row.affectedCount) },
    { key: "sample", header: t("alerts.sampleChassis"), render: (row) => formatValue(row.sampleChassis?.join(", ")) },
    { key: "severity", header: t("table.severity"), render: (row) => <StatusBadge tone={row.severity} /> },
    { key: "action", header: t("alerts.recommendedAction"), render: (row) => formatValue(row.recommendedAction) },
    {
      key: "vehicles",
      header: t("common.actions"),
      render: (row) =>
        (row.affectedVehicles?.length ?? 0) > 0 ? (
          <button className="report-button" type="button" onClick={() => setSelectedAlertId((current) => (current === row.id ? null : row.id))}>
            {t("alerts.viewAffectedVehicles")}
          </button>
        ) : "-",
    },
  ];
  const vehicleColumns: DataTableColumn<InventoryItem>[] = [
    { key: "chassis", header: t("alerts.chassis"), render: (row) => formatValue(row.chassis) },
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "status", header: t("table.status"), render: (row) => formatValue(row.displayStatus || row.normalizedStatus) },
    { key: "transactionClass", header: t("transaction.class"), render: (row) => t(transactionClassLabelKey(classifyTransaction(row))) },
    { key: "customerGroup", header: t("table.columns.customerGroup"), render: (row) => formatValue(row.customerGroup) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "age", header: t("table.stockAgeDays"), render: (row) => formatValue(row.stockAgeDays) },
    { key: "reserveDate", header: t("table.columns.reserveDate"), render: (row) => formatValue(row.reserveDate) },
  ];
  const criticalCount = rows.filter((row) => row.severity === "critical").length;
  const warningCount = rows.filter((row) => row.severity === "warning").length;
  const totalAffected = rows.reduce((sum, row) => sum + (row.affectedUnits ?? row.affectedCount ?? 0), 0);

  return (
    <>
      <PageHeader title={t("pages.alerts.title")} description={t("pages.alerts.description")} />
      <FilterBar compact filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("alerts.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("alerts.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("alerts.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <ChartGrid>
        <DonutChartCard title={t("charts.alertsBySeverity")} subtitle={t("charts.liveFilteredData")} insight={`${criticalCount} / ${warningCount} ${t("table.severity")}`} data={alertsBySeverity} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.alertsByType")} subtitle={t("charts.top10")} insight={`${rows.length} ${t("alerts.totalAlertGroups")}`} data={alertCountsByType} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.affectedUnitsByAlertType")} subtitle={t("charts.top10")} insight={`${totalAffected} ${t("alerts.totalAffectedUnits")}`} data={alertsByType} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.topAffectedModels")} subtitle={t("charts.top10")} insight={`${topAffectedModels[0]?.name ?? ""}`} data={topAffectedModels} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.alertQueue")} eyebrow={t("summary.liveData")} action={String(rows.length)}>
        <p>{t("alerts.groupedAlertsNote")}</p>
        <div className="report-actions">
          <span>{t("alerts.totalAlertGroups")}: {rows.length}</span>
          <span>{t("alerts.totalAffectedUnits")}: {totalAffected}</span>
          <span>{t("table.severity")}: {criticalCount} / {warningCount}</span>
        </div>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      {selectedAlert ? (
        <SectionCard title={t("alerts.viewAffectedVehicles")} eyebrow={selectedAlert.title} action={String(selectedAlert.affectedVehicles?.length ?? 0)}>
          <DataTable columns={vehicleColumns} rows={selectedAlert.affectedVehicles ?? []} maxVisibleRows={15} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
      ) : null}
    </>
  );
}



