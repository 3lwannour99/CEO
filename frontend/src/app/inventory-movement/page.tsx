"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { MetaStrip } from "@/components/MetaStrip/MetaStrip";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatDate, formatNumber, formatValue } from "@/lib/apiClient";
import { formatMoneyBundle } from "@/lib/currency";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";

export default function InventoryMovementPage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "chassis", header: t("table.chassis"), render: (row) => formatValue(row.chassis) },
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "source", header: t("table.source"), render: (row) => row.sourceName },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "status", header: t("table.status"), render: (row) => <StatusBadge tone={row.normalizedStatus || "unknown"} /> },
    { key: "age", header: t("table.stockAgeDays"), render: (row) => formatValue(row.stockAgeDays) },
    { key: "movement", header: t("table.movementCategory"), render: (row) => <StatusBadge tone={row.movementCategory} /> },
    { key: "grpo", header: t("table.grpoDate"), render: (row) => formatDate(row.grpoDate) },
    { key: "price1", header: t("table.price1"), render: (row) => formatMoneyBundle(row.price1, row, language, selectedCurrencies) },
    { key: "price2", header: t("table.price2"), render: (row) => formatMoneyBundle(row.price2, row, language, selectedCurrencies) },
    { key: "price3", header: t("table.price3"), render: (row) => formatMoneyBundle(row.price3, row, language, selectedCurrencies) },
    { key: "price4", header: t("table.price4"), render: (row) => formatMoneyBundle(row.price4, row, language, selectedCurrencies) },
    { key: "soldPrice", header: t("table.soldPrice"), render: (row) => formatMoneyBundle(row.soldPrice, row, language, selectedCurrencies) },
    { key: "vat", header: t("table.vat"), render: (row) => formatMoneyBundle(row.vat, row, language, selectedCurrencies) },
    { key: "qty", header: t("table.qty"), render: (row) => formatNumber(row.quantity) },
  ];

  return (
    <>
      <PageHeader title={t("pages.inventoryMovement.title")} description={t("pages.inventoryMovement.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <MetaStrip meta={inventoryData.meta} />
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && rows.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.movementRegister")} eyebrow={t("summary.liveData")} action={formatNumber(rows.length)}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



