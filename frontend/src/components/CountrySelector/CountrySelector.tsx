"use client";

import { useMemo } from "react";
import { useAppBusy } from "@/hooks/useAppBusy";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import { getFilterOptions } from "@/lib/filterOptions";
import styles from "./CountrySelector.module.css";

export function CountrySelector() {
  const { t } = useI18n();
  const isBusy = useAppBusy();
  const { filters, setFilters } = useGlobalFilters();
  const { inventoryItems, sources } = useInventoryData();
  const countryOptions = useMemo(
    () => getFilterOptions(inventoryItems, sources).countries,
    [inventoryItems, sources],
  );

  function toggleCountry(country: string) {
    const countries = filters.countries.includes(country)
      ? filters.countries.filter((item) => item !== country)
      : [...filters.countries, country];

    setFilters({ ...filters, countries });
  }

  if (countryOptions.length === 0) {
    return null;
  }

  return (
    <div className={styles.group} aria-label={t("filters.country")}>
      <button
        className={`${styles.option} ${filters.countries.length === 0 ? styles.active : ""}`}
        type="button"
        onClick={() => setFilters({ ...filters, countries: [] })}
        aria-pressed={filters.countries.length === 0}
        disabled={isBusy}
      >
        {t("topbar.allCountries")}
      </button>
      {countryOptions.map((country) => (
        <button
          className={`${styles.option} ${filters.countries.includes(country.value) ? styles.active : ""}`}
          type="button"
          key={country.value}
          onClick={() => toggleCountry(country.value)}
          aria-pressed={filters.countries.includes(country.value)}
          disabled={isBusy}
          title={country.label}
        >
          {country.label}
        </button>
      ))}
    </div>
  );
}
