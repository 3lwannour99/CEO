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
import { formatNumber, formatValue } from "@/lib/apiClient";
import { useI18n } from "@/i18n/useI18n";
import type { StockCoverageItem } from "@/types/inventory";

export default function StockCoveragePage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getStockCoverage(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<StockCoverageItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    { key: "current", header: t("table.currentStock"), render: (row) => formatNumber(row.currentStock) },
    { key: "sold90", header: t("table.soldLast90Days"), render: (row) => formatNumber(row.soldLast90Days) },
    { key: "coverage", header: t("table.coverage"), render: (row) => formatValue(row.coverageMonths) },
    { key: "status", header: t("table.status"), render: (row) => <StatusBadge tone={row.status === "danger" ? "critical" : row.status === "overstock" ? "warning" : "success"}>{row.status}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader title={t("pages.stockCoverage.title")} description={t("pages.stockCoverage.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.coverageByModel")} eyebrow={t("sections.inventoryPlanning")}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



