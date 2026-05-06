"use client";

import { useI18n } from "@/i18n/useI18n";
import { formatDate } from "@/lib/apiClient";
import type { ApiMeta } from "@/types/inventory";
import styles from "./MetaStrip.module.css";

interface MetaStripProps {
  meta?: ApiMeta;
}

export function MetaStrip({ meta }: MetaStripProps) {
  const { t } = useI18n();

  if (!meta) {
    return null;
  }

  return (
    <div className={styles.meta}>
      <span>{t("summary.liveData")}</span>
      <span>{t("summary.lastUpdated")}: {formatDate(meta.generatedAt)}</span>
      <span>{t("summary.fromCache")}: {meta.fromCache ? t("summary.yes") : t("summary.no")}</span>
      <span>{t("summary.successfulSources")}: {meta.successfulSources}</span>
      <span>{t("summary.failedSources")}: {meta.failedSources}</span>
    </div>
  );
}
