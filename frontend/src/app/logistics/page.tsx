"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { logisticsStatuses } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { LogisticsStatus } from "@/types/inventory";
import styles from "../dashboard/dashboard.module.css";

export default function LogisticsPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<LogisticsStatus>[] = [
    { key: "shipment", header: t("table.shipment"), render: (row) => row.shipment },
    { key: "po", header: t("table.poNo"), render: (row) => row.poNo },
    { key: "status", header: t("table.status"), render: (row) => row.status },
    { key: "eta", header: t("table.eta"), render: (row) => row.eta },
    { key: "units", header: t("table.units"), render: (row) => row.units },
    { key: "branch", header: t("table.destination"), render: (row) => row.branch },
  ];

  return (
    <>
      <PageHeader title={t("pages.logistics.title")} description={t("pages.logistics.description")} />
      <FilterBar compact />
      <section className={styles.miniCardGrid}>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.atPort")}</p><p className={styles.miniCardMeta}>{t("summary.atPortText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.inTransfer")}</p><p className={styles.miniCardMeta}>{t("summary.inTransferText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.scheduled")}</p><p className={styles.miniCardMeta}>{t("summary.scheduledText")}</p></div>
      </section>
      <SectionCard title={t("sections.logisticsStatus")} eyebrow={t("sections.inboundOperations")}>
        <DataTable columns={columns} rows={logisticsStatuses} />
      </SectionCard>
    </>
  );
}
