"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatDate, formatNumber, formatValue } from "@/lib/apiClient";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { LogisticsStatus } from "@/types/inventory";

export default function LogisticsPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getLogistics(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
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
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.logisticsStatus")} eyebrow={t("sections.inboundOperations")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



