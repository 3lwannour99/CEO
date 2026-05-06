"use client";

import { dateFields, datePresets } from "@/lib/dateFilters";
import { useAppBusy } from "@/hooks/useAppBusy";
import { useI18n } from "@/i18n/useI18n";
import type { DateField, DatePreset, InventoryFilters } from "@/types/filters";
import styles from "./DateFilter.module.css";

interface DateFilterProps {
  filters: InventoryFilters;
  onChange: (filters: InventoryFilters) => void;
}

export function DateFilter({ filters, onChange }: DateFilterProps) {
  const { t } = useI18n();
  const isBusy = useAppBusy();

  function update(patch: Partial<InventoryFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className={styles.dateFilter}>
      <label className={styles.field}>
        <span>{t("filters.dateField")}</span>
        <select value={filters.dateField} onChange={(event) => update({ dateField: event.target.value as DateField })} disabled={isBusy}>
          {dateFields.map((field) => (
            <option value={field.value} key={field.value}>
              {t(field.key)}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("filters.datePreset")}</span>
        <select value={filters.datePreset ?? ""} onChange={(event) => update({ datePreset: event.target.value as DatePreset, exactDate: "" })} disabled={isBusy}>
          {datePresets.map((preset) => (
            <option value={preset.value} key={preset.value}>
              {t(preset.key)}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("filters.exactDate")}</span>
        <input type="date" value={filters.exactDate ?? ""} onChange={(event) => update({ exactDate: event.target.value, datePreset: "", fromDate: "", toDate: "" })} disabled={isBusy} />
      </label>
      <label className={styles.field}>
        <span>{t("filters.fromDate")}</span>
        <input type="date" value={filters.fromDate ?? ""} onChange={(event) => update({ fromDate: event.target.value, exactDate: "", datePreset: "" })} disabled={isBusy} />
      </label>
      <label className={styles.field}>
        <span>{t("filters.toDate")}</span>
        <input type="date" value={filters.toDate ?? ""} onChange={(event) => update({ toDate: event.target.value, exactDate: "", datePreset: "" })} disabled={isBusy} />
      </label>
      <button className={styles.clearButton} type="button" onClick={() => update({ dateField: "all", fromDate: "", toDate: "", exactDate: "", datePreset: "" })} disabled={isBusy}>
        {t("filters.clear")}
      </button>
    </div>
  );
}
