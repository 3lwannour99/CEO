"use client";

import { DateFilter } from "@/components/DateFilter/DateFilter";
import { MultiSelect } from "@/components/MultiSelect/MultiSelect";
import { getFilterOptions } from "@/lib/filterOptions";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryFilters } from "@/types/filters";
import { emptyInventoryFilters } from "@/types/filters";
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
  const options = getFilterOptions(inventoryItems, sources);
  const translatedOptions = {
    ...options,
    statuses: [
      { label: t("status.available"), value: "in-stock" },
      { label: t("status.sold"), value: "sold" },
      { label: t("status.reserved"), value: "reserved" },
      { label: t("status.unknown"), value: "unknown" },
    ],
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
  };

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
      <label className={styles.field}>
        <span>{t("filters.search")}</span>
        <input value={filters.search} onChange={(event) => onChange({ ...filters, search: event.target.value })} placeholder={t("topbar.searchPlaceholder")} />
      </label>
      <DateFilter filters={filters} onChange={onChange} />
      <button className={styles.resetButton} type="button" onClick={() => onChange(emptyInventoryFilters)}>
        {t("filters.resetFilters")}
      </button>
    </form>
  );
}
