"use client";

import { useI18n } from "@/i18n/useI18n";
import styles from "./BiChartCard.module.css";

interface BiChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
}

export function BiChartCard({ title, subtitle, insight, isLoading = false, isEmpty = false, children }: BiChartCardProps) {
  const { t } = useI18n();

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {insight ? <p className={styles.insight}>{insight}</p> : null}
      </div>
      {isLoading ? <div className={styles.skeleton} aria-label={t("common.loading")} /> : isEmpty ? <div className={styles.empty}>{t("charts.noData")}</div> : <div className={styles.body}>{children}</div>}
    </section>
  );
}
