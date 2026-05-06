"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { salesPerformance } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { SalesPerformanceItem } from "@/types/inventory";
import styles from "../dashboard/dashboard.module.css";

export default function SalesPerformancePage() {
  const { t } = useI18n();
  const columns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "units", header: t("table.unitsSold"), render: (row) => row.unitsSold },
    { key: "revenue", header: t("table.revenue"), render: (row) => `$${row.revenue.toLocaleString()}` },
    { key: "margin", header: t("table.margin"), render: (row) => row.margin },
  ];

  return (
    <>
      <PageHeader title={t("pages.salesPerformance.title")} description={t("pages.salesPerformance.description")} />
      <FilterBar />
      <section className={styles.miniCardGrid}>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.thisMonth")}</p><p className={styles.miniCardMeta}>{t("summary.thisMonthText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.topModel")}</p><p className={styles.miniCardMeta}>{t("summary.topModelText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.fleetDemand")}</p><p className={styles.miniCardMeta}>{t("summary.fleetDemandText")}</p></div>
      </section>
      <SectionCard title={t("sections.salesPerformanceTable")} eyebrow={t("sections.commercial")}>
        <DataTable columns={columns} rows={salesPerformance} />
      </SectionCard>
    </>
  );
}
