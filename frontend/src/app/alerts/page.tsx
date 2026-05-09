"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatValue } from "@/lib/apiClient";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryAlert } from "@/types/inventory";

export default function AlertsPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getAlerts(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<InventoryAlert>[] = [
    { key: "id", header: t("table.id"), render: (row) => row.id },
    { key: "title", header: t("table.title"), render: (row) => row.title },
    { key: "message", header: t("table.message"), render: (row) => row.message },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "severity", header: t("table.severity"), render: (row) => <StatusBadge tone={row.severity} /> },
    { key: "created", header: t("table.created"), render: (row) => row.createdAt },
  ];

  return (
    <>
      <PageHeader title={t("pages.alerts.title")} description={t("pages.alerts.description")} />
      <FilterBar compact filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("alerts.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("alerts.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("alerts.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.alertQueue")} eyebrow={t("summary.liveData")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



