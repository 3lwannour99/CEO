"use client";

import { useAppBusy } from "@/hooks/useAppBusy";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import type { CurrencyCode } from "@/lib/currency";
import styles from "./CurrencySelector.module.css";

const currencies: CurrencyCode[] = ["SAR", "JOD", "USD"];

export function CurrencySelector() {
  const { selectedCurrencies, toggleCurrency } = useCurrencyDisplay();
  const isBusy = useAppBusy();

  return (
    <div className={styles.group} aria-label="Currency display">
      {currencies.map((currency) => (
        <button
          className={`${styles.option} ${selectedCurrencies.includes(currency) ? styles.active : ""}`}
          type="button"
          key={currency}
          onClick={() => toggleCurrency(currency)}
          aria-pressed={selectedCurrencies.includes(currency)}
          disabled={isBusy}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}

