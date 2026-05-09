"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber, formatValue } from "@/lib/apiClient";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useI18n } from "@/i18n/useI18n";
import type { LocationStock, RebalancingRecommendation } from "@/types/inventory";

export default function MultiLocationPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getMultiLocation(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<LocationStock>[] = [
    { key: "source", header: t("table.source"), render: (row) => formatValue(row.sourceName) },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "model", header: t("table.model"), render: (row) => `${formatValue(row.brand)} ${formatValue(row.model)}` },
    { key: "color", header: t("table.color"), render: (row) => formatValue(row.exteriorColor) },
    { key: "current", header: t("table.currentStock"), render: (row) => formatNumber(row.currentStock) },
  ];
  const transferColumns: DataTableColumn<RebalancingRecommendation>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${formatValue(row.brand)} ${formatValue(row.model)}` },
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



