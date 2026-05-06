"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { inventoryItems } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";

export default function AggregatedStockPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "type", header: t("table.type"), render: (row) => row.type },
    { key: "color", header: t("table.exterior"), render: (row) => row.exteriorColor },
    { key: "quantity", header: t("table.totalUnits"), render: (row) => row.quantity },
    { key: "branch", header: t("table.primaryBranch"), render: (row) => row.branch },
  ];

  return (
    <>
      <PageHeader title={t("pages.aggregatedStock.title")} description={t("pages.aggregatedStock.description")} />
      <FilterBar />
      <SectionCard title={t("sections.aggregatedStockView")} eyebrow={t("sections.stockRollup")}>
        <DataTable columns={columns} rows={inventoryItems} />
      </SectionCard>
    </>
  );
}
