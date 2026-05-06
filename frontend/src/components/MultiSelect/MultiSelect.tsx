"use client";

import { useMemo, useState } from "react";
import { useAppBusy } from "@/hooks/useAppBusy";
import { useI18n } from "@/i18n/useI18n";
import type { PageFilterOption } from "@/types/inventory";
import styles from "./MultiSelect.module.css";

interface MultiSelectProps {
  label: string;
  options: PageFilterOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelect({ label, options, values, onChange }: MultiSelectProps) {
  const { t } = useI18n();
  const isBusy = useAppBusy();
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  function toggleValue(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className={styles.multiSelect}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {values.length > 0 ? (
          <button className={styles.clearButton} type="button" onClick={() => onChange([])} disabled={isBusy}>
            {t("filters.clear")}
          </button>
        ) : null}
      </div>
      <details className={styles.dropdown}>
        <summary className={styles.summary}>
          {values.length > 0 ? `${values.length} ${t("filters.selected")}` : label}
        </summary>
        <div className={styles.panel}>
          <input
            className={styles.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("filters.search")}
            disabled={isBusy}
          />
          <div className={styles.options}>
            {filteredOptions.map((option) => (
              <label className={styles.option} key={option.value}>
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                  disabled={isBusy}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
