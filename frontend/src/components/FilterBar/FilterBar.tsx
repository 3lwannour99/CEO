"use client";

import { useI18n } from "@/i18n/useI18n";
import styles from "./FilterBar.module.css";

interface FilterBarProps {
  compact?: boolean;
}

export function FilterBar({ compact = false }: FilterBarProps) {
  const { t } = useI18n();

  return (
    <form className={`${styles.filterBar} ${compact ? styles.compact : ""}`}>
      <label className={styles.field}>
        <span>{t("filters.brand")}</span>
        <select>
          <option>{t("filters.allBrands")}</option>
          <option>Toyota</option>
          <option>BMW</option>
          <option>Hyundai</option>
          <option>Land Rover</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("filters.branch")}</span>
        <select>
          <option>{t("filters.allBranches")}</option>
          <option>Amman Main</option>
          <option>Sweifieh</option>
          <option>Irbid</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("filters.status")}</span>
        <select>
          <option>{t("filters.allStatuses")}</option>
          <option>{t("filters.available")}</option>
          <option>{t("filters.reserved")}</option>
          <option>{t("filters.inTransit")}</option>
          <option>{t("filters.serviceHold")}</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("filters.period")}</span>
        <input type="month" defaultValue="2026-05" />
      </label>
      <button className={styles.applyButton} type="button">
        {t("filters.apply")}
      </button>
    </form>
  );
}
