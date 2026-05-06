"use client";

import { useI18n } from "@/i18n/useI18n";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  const { t } = useI18n();

  return (
    <section className={styles.screen} aria-busy="true">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{t("filters.loadingData")}</p>
          <h1>{t("filters.loadingDashboard")}</h1>
          <p>{t("filters.loadingWait")}</p>
        </div>
        <div className={styles.spinner} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div className={styles.card} key={index}>
            <span />
            <strong />
            <em />
          </div>
        ))}
      </div>
      <div className={styles.sections}>
        <div className={styles.section} />
        <div className={styles.section} />
      </div>
    </section>
  );
}
