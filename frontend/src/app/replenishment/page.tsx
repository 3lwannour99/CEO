"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { inventoryItems } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";
import styles from "../dashboard/dashboard.module.css";

export default function ReplenishmentPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "available", header: t("table.available"), render: (row) => row.quantity },
    { key: "coverage", header: t("table.coverage"), render: (row) => `${row.coverageMonths} ${t("summary.months")}` },
    { key: "suggested", header: t("table.suggestedAction"), render: (row) => (row.coverageMonths < 2 ? t("status.reorderPriority") : t("status.monitorDemand")) },
    { key: "po", header: t("table.openPo"), render: (row) => row.poNo },
  ];

  return (
    <>
      <PageHeader title={t("pages.replenishment.title")} description={t("pages.replenishment.description")} />
      <FilterBar />
      <section className={styles.miniCardGrid}>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.priorityReorder")}</p><p className={styles.miniCardMeta}>{t("summary.priorityReorderText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.openPurchaseOrders")}</p><p className={styles.miniCardMeta}>{t("summary.openPurchaseOrdersText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.balancedStock")}</p><p className={styles.miniCardMeta}>{t("summary.balancedStockText")}</p></div>
      </section>
      <SectionCard title={t("sections.replenishmentSuggestions")} eyebrow={t("sections.planning")}>
        <DataTable columns={columns} rows={inventoryItems} />
      </SectionCard>
    </>
  );
}
