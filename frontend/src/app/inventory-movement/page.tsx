"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { inventoryItems } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";

export default function InventoryMovementPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "chassis", header: t("table.chassis"), render: (row) => row.chassis },
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => row.warehouse },
    { key: "status", header: t("table.status"), render: (row) => <StatusBadge tone={row.chassisStatus} /> },
    { key: "movement", header: t("table.movement"), render: (row) => <StatusBadge tone={row.movementVelocity} /> },
    { key: "grpo", header: t("table.grpoDate"), render: (row) => row.grpoDate || t("status.pending") },
  ];

  return (
    <>
      <PageHeader title={t("pages.inventoryMovement.title")} description={t("pages.inventoryMovement.description")} />
      <FilterBar />
      <SectionCard title={t("sections.movementRegister")} eyebrow={t("app.mockSapFields")} action={t("app.unitsSampled")}>
        <DataTable columns={columns} rows={inventoryItems} />
      </SectionCard>
    </>
  );
}
