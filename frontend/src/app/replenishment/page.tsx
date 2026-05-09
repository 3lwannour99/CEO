"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { formatNumber } from "@/lib/apiClient";
import { useI18n } from "@/i18n/useI18n";
import type { ReplenishmentSuggestion } from "@/types/inventory";

export default function ReplenishmentPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getReplenishment(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<ReplenishmentSuggestion>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    { key: "current", header: t("table.currentStock"), render: (row) => formatNumber(row.currentStock) },
    { key: "sold90", header: t("table.soldLast90Days"), render: (row) => formatNumber(row.soldLast90Days) },
    { key: "avg", header: t("table.averageMonthlySales"), render: (row) => formatNumber(row.averageMonthlySales) },
    { key: "suggested", header: t("table.suggestedOrderQuantity"), render: (row) => formatNumber(row.suggestedOrderQuantity) },
  ];

  return (
    <>
      <PageHeader title={t("pages.replenishment.title")} description={t("pages.replenishment.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("replenishment.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("replenishment.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("replenishment.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.replenishmentSuggestions")} eyebrow={t("sections.planning")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



