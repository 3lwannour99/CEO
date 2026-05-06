"use client";

import { useMemo, useState } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber } from "@/lib/apiClient";
import { useI18n } from "@/i18n/useI18n";
import { emptyInventoryFilters, type InventoryFilters } from "@/types/filters";
import type { ReplenishmentSuggestion } from "@/types/inventory";

export default function ReplenishmentPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const [filters, setFilters] = useState<InventoryFilters>(emptyInventoryFilters);
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
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={() => setFilters(emptyInventoryFilters)} />
      <SectionCard title={t("sections.replenishmentSuggestions")} eyebrow={t("sections.planning")}>
        <DataTable columns={columns} rows={rows} />
      </SectionCard>
    </>
  );
}
