"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const selectAllRef = useRef<HTMLInputElement>(null);
  const optionValues = useMemo(() => options.map((option) => option.value), [options]);
  const optionValueSet = useMemo(() => new Set(optionValues), [optionValues]);
  const selectedOptionCount = useMemo(
    () => values.filter((value) => optionValueSet.has(value)).length,
    [optionValueSet, values],
  );
  const allSelected = optionValues.length > 0 && selectedOptionCount === optionValues.length;
  const someSelected = selectedOptionCount > 0 && selectedOptionCount < optionValues.length;
  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );
  const selectedLabels = useMemo(
    () =>
      values.map((value) => options.find((option) => option.value === value)?.label ?? value),
    [options, values],
  );
  const summaryLabel = useMemo(() => {
    if (selectedLabels.length === 0) {
      return label;
    }

    if (selectedLabels.length <= 2) {
      return selectedLabels.join(", ");
    }

    return `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`;
  }, [label, selectedLabels]);

  function toggleValue(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function toggleAll() {
    if (allSelected) {
      onChange(values.filter((value) => !optionValueSet.has(value)));
      return;
    }

    onChange([...values.filter((value) => !optionValueSet.has(value)), ...optionValues]);
  }

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

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
        <summary className={styles.summary} title={selectedLabels.join(", ")}>
          <span className={styles.summaryText}>{summaryLabel}</span>
          {values.length > 0 ? <span className={styles.selectedCount}>{values.length} {t("filters.selected")}</span> : null}
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
            {options.length > 0 ? (
              <label className={`${styles.option} ${styles.selectAllOption}`}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={isBusy}
                />
                <span>{t("filters.selectAll")}</span>
              </label>
            ) : null}
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
