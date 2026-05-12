"use client";

import { useEffect, useMemo, useRef } from "react";
import { DateFilter } from "@/components/DateFilter/DateFilter";
import { MultiSelect } from "@/components/MultiSelect/MultiSelect";
import { OFFICIAL_VEHICLE_STATUSES } from "@/constants/statuses";
import { useAppBusy } from "@/hooks/useAppBusy";
import { getFilterOptions } from "@/lib/filterOptions";
import { transactionClassOptions } from "@/lib/transactionClassification";
import { useI18n } from "@/i18n/useI18n";
import { createDefaultInventoryFilters, type InventoryFilters } from "@/types/filters";
import type { CounterScreenSource, InventoryItem } from "@/types/inventory";
import styles from "./FilterBar.module.css";

interface FilterBarProps {
  compact?: boolean;
  filters: InventoryFilters;
  inventoryItems: InventoryItem[];
  sources: CounterScreenSource[];
  onChange: (filters: InventoryFilters) => void;
}

export function FilterBar({ compact = false, filters, inventoryItems, sources, onChange }: FilterBarProps) {
  const { t } = useI18n();
  const isBusy = useAppBusy();
  const searchTimeoutRef = useRef<number | null>(null);
  const latestFiltersRef = useRef(filters);
  const options = useMemo(() => getFilterOptions(inventoryItems, sources), [inventoryItems, sources]);
  const translatedOptions = useMemo(
    () => ({
      ...options,
      statuses: OFFICIAL_VEHICLE_STATUSES.map((status) => ({ label: t(status.labelKey), value: status.value })),
      movementCategories: [
        { label: t("status.fast"), value: "fast" },
        { label: t("status.medium"), value: "medium" },
        { label: t("status.slow"), value: "slow" },
        { label: t("status.unknown"), value: "unknown" },
      ],
      readyStatuses: [
        { label: t("status.readyForSale"), value: "ready" },
        { label: t("status.unknown"), value: "not-ready" },
      ],
      transactionClasses: transactionClassOptions.map((value) => ({
        label: t(`transaction.${value}`),
        value,
      })),
    }),
    [options, t],
  );

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  function updateSearch(value: string) {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      onChange({ ...latestFiltersRef.current, search: value });
    }, 250);
  }

  return (
    <form className={`${styles.filterBar} ${compact ? styles.compact : ""}`}>
      <MultiSelect label={t("filters.source")} options={translatedOptions.sources} values={filters.sourceIds} onChange={(sourceIds) => onChange({ ...filters, sourceIds })} />
      <MultiSelect label={t("filters.country")} options={translatedOptions.countries} values={filters.countries} onChange={(countries) => onChange({ ...filters, countries })} />
      <MultiSelect label={t("filters.brand")} options={translatedOptions.brands} values={filters.brands} onChange={(brands) => onChange({ ...filters, brands })} />
      <MultiSelect label={t("filters.model")} options={translatedOptions.models} values={filters.models} onChange={(models) => onChange({ ...filters, models })} />
      <MultiSelect label={t("filters.modelYear")} options={translatedOptions.modelYears} values={filters.modelYears} onChange={(modelYears) => onChange({ ...filters, modelYears })} />
      <MultiSelect label={t("filters.type")} options={translatedOptions.types} values={filters.types} onChange={(types) => onChange({ ...filters, types })} />
      <MultiSelect label={t("filters.exteriorColor")} options={translatedOptions.exteriorColors} values={filters.exteriorColors} onChange={(exteriorColors) => onChange({ ...filters, exteriorColors })} />
      <MultiSelect label={t("filters.interiorColor")} options={translatedOptions.interiorColors} values={filters.interiorColors} onChange={(interiorColors) => onChange({ ...filters, interiorColors })} />
      <MultiSelect label={t("filters.branch")} options={translatedOptions.branches} values={filters.branches} onChange={(branches) => onChange({ ...filters, branches })} />
      <MultiSelect label={t("filters.warehouse")} options={translatedOptions.warehouses} values={filters.warehouses} onChange={(warehouses) => onChange({ ...filters, warehouses })} />
      <MultiSelect label={t("filters.status")} options={translatedOptions.statuses} values={filters.statuses} onChange={(statuses) => onChange({ ...filters, statuses })} />
      <MultiSelect label={t("filters.movementCategory")} options={translatedOptions.movementCategories} values={filters.movementCategories} onChange={(movementCategories) => onChange({ ...filters, movementCategories })} />
      <MultiSelect label={t("filters.readyStatus")} options={translatedOptions.readyStatuses} values={filters.readyStatuses} onChange={(readyStatuses) => onChange({ ...filters, readyStatuses })} />
      <MultiSelect label={t("filters.customerGroup")} options={translatedOptions.customerGroups} values={filters.customerGroups} onChange={(customerGroups) => onChange({ ...filters, customerGroups })} />
      <MultiSelect label={t("filters.salesman")} options={translatedOptions.salesmen} values={filters.salesmen} onChange={(salesmen) => onChange({ ...filters, salesmen })} />
      <MultiSelect label={t("transaction.class")} options={translatedOptions.transactionClasses} values={filters.transactionClasses} onChange={(transactionClasses) => onChange({ ...filters, transactionClasses })} />
      <label className={styles.field}>
        <span>{t("filters.search")}</span>
        <input key={filters.search} defaultValue={filters.search} onChange={(event) => updateSearch(event.target.value)} placeholder={t("topbar.searchPlaceholder")} disabled={isBusy} />
      </label>
      <DateFilter filters={filters} onChange={onChange} />
      <button
        className={styles.resetButton}
        type="button"
        onClick={() => {
          const defaultFilters = createDefaultInventoryFilters();
          onChange(defaultFilters);
        }}
        disabled={isBusy}
      >
        {t("filters.resetFilters")}
      </button>
    </form>
  );
}
