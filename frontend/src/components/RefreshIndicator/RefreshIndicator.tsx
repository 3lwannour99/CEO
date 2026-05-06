"use client";

import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import styles from "./RefreshIndicator.module.css";

export function RefreshIndicator() {
  const { isRefreshing } = useInventoryData();
  const { t } = useI18n();

  if (!isRefreshing) {
    return null;
  }

  return (
    <div className={styles.indicator} role="status">
      <span />
      {t("filters.refreshingData")}
    </div>
  );
}
