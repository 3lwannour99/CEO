"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { inventoryItems } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";

export default function StockCoveragePage() {
  const { t } = useI18n();
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "quantity", header: t("table.quantity"), render: (row) => row.quantity },
    { key: "coverage", header: t("table.coverage"), render: (row) => `${row.coverageMonths} ${t("summary.months")}` },
    { key: "velocity", header: t("table.velocity"), render: (row) => <StatusBadge tone={row.movementVelocity} /> },
    { key: "risk", header: t("table.riskBand"), render: (row) => (row.coverageMonths > 6 ? t("status.overstockRisk") : row.coverageMonths < 2 ? t("status.shortageRisk") : t("status.healthy")) },
  ];

  return (
    <>
      <PageHeader title={t("pages.stockCoverage.title")} description={t("pages.stockCoverage.description")} />
      <FilterBar />
      <SectionCard title={t("sections.coverageByModel")} eyebrow={t("sections.inventoryPlanning")}>
        <DataTable columns={columns} rows={inventoryItems} />
      </SectionCard>
    </>
  );
}
