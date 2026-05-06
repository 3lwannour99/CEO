"use client";

import { useI18n } from "@/i18n/useI18n";
import styles from "./ApiState.module.css";

interface ApiStateProps {
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  partial?: boolean;
  empty?: boolean;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ApiState({ loading, refreshing, error, partial, empty, onRetry, onReset }: ApiStateProps) {
  const { t } = useI18n();

  if (loading) {
    return <div className={styles.skeleton}>{t("filters.loadingData")}</div>;
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.error}`}>
        <strong>{t("summary.apiError")}</strong>
        <span>{error}</span>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            {t("filters.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (partial) {
    return <div className={`${styles.state} ${styles.warning}`}>{t("filters.partialDataWarning")}</div>;
  }

  if (empty) {
    return (
      <div className={styles.state}>
        <strong>{t("filters.emptyFiltered")}</strong>
        {onReset ? (
          <button type="button" onClick={onReset}>
            {t("filters.resetFilters")}
          </button>
        ) : null}
      </div>
    );
  }

  if (refreshing) {
    return <div className={styles.refreshing}>{t("filters.refreshingData")}</div>;
  }

  return null;
}
