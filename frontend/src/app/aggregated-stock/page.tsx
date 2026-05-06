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
import type { AggregatedStockItem } from "@/types/inventory";

export default function AggregatedStockPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const [filters, setFilters] = useState<InventoryFilters>(emptyInventoryFilters);
  const rows = useMemo(() => inventoryData.getAggregatedStock(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<AggregatedStockItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "color", header: t("table.exterior"), render: (row) => row.exteriorColor },
    { key: "units", header: t("table.totalUnits"), render: (row) => formatNumber(row.units) },
  ];

  return (
    <>
      <PageHeader title={t("pages.aggregatedStock.title")} description={t("pages.aggregatedStock.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={() => setFilters(emptyInventoryFilters)} />
      <SectionCard title={t("sections.aggregatedStockView")} eyebrow={t("sections.stockRollup")}>
        <DataTable columns={columns} rows={rows} />
      </SectionCard>
    </>
  );
}
