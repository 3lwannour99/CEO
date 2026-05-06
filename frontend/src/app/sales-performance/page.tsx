"use client";

import { useMemo, useState } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatCurrency, formatNumber } from "@/lib/apiClient";
import { useI18n } from "@/i18n/useI18n";
import { emptyInventoryFilters, type InventoryFilters } from "@/types/filters";
import type { SalesPerformanceItem } from "@/types/inventory";

export default function SalesPerformancePage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const [filters, setFilters] = useState<InventoryFilters>(emptyInventoryFilters);
  const data = useMemo(() => inventoryData.getSalesPerformance(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "units", header: t("table.unitsSold"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatCurrency(row.revenue) },
  ];

  return (
    <>
      <PageHeader title={t("pages.salesPerformance.title")} description={t("pages.salesPerformance.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={() => setFilters(emptyInventoryFilters)} />
      <SectionCard title={t("sections.salesPerformanceTable")} eyebrow={t("sections.commercial")}>
        <DataTable columns={columns} rows={data.topSellingModels} />
      </SectionCard>
    </>
  );
}
