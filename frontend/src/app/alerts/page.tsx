"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { alerts } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryAlert } from "@/types/inventory";
import styles from "../dashboard/dashboard.module.css";

export default function AlertsPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<InventoryAlert>[] = [
    { key: "id", header: t("table.id"), render: (row) => row.id },
    { key: "title", header: t("table.title"), render: (row) => row.title },
    { key: "message", header: t("table.message"), render: (row) => row.message },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "severity", header: t("table.severity"), render: (row) => <StatusBadge tone={row.severity} /> },
    { key: "created", header: t("table.created"), render: (row) => row.createdAt },
  ];

  return (
    <>
      <PageHeader title={t("pages.alerts.title")} description={t("pages.alerts.description")} />
      <FilterBar compact />
      <section className={styles.miniCardGrid}>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.criticalAlerts")}</p><p className={styles.miniCardMeta}>{t("summary.criticalAlertsText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.warningAlerts")}</p><p className={styles.miniCardMeta}>{t("summary.warningAlertsText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.informational")}</p><p className={styles.miniCardMeta}>{t("summary.informationalText")}</p></div>
      </section>
      <SectionCard title={t("sections.alertQueue")} eyebrow={t("app.mockAutomationRules")}>
        <DataTable columns={columns} rows={alerts} />
      </SectionCard>
    </>
  );
}
