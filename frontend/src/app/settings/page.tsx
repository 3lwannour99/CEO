"use client";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useI18n } from "@/i18n/useI18n";
import styles from "../dashboard/dashboard.module.css";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("pages.settings.title")} description={t("pages.settings.description")} meta={t("app.authenticationDeferred")} />
      <section className={styles.miniCardGrid}>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.permissions")}</p><p className={styles.miniCardMeta}>{t("summary.permissionsText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.integrations")}</p><p className={styles.miniCardMeta}>{t("summary.integrationsText")}</p></div>
        <div className={styles.miniCard}><p className={styles.miniCardTitle}>{t("summary.exportsAndAlerts")}</p><p className={styles.miniCardMeta}>{t("summary.exportsAndAlertsText")}</p></div>
      </section>
      <SectionCard title={t("sections.systemReadiness")} eyebrow={t("sections.configuration")}>
        <div className={styles.summaryList}>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.frontendShell")}</span><span className={styles.summaryValue}>{t("summary.ready")}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.mockApiStructure")}</span><span className={styles.summaryValue}>{t("summary.ready")}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.realIntegrations")}</span><span className={styles.summaryValue}>{t("summary.deferred")}</span></div>
        </div>
      </SectionCard>
    </>
  );
}
