"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CurrencyCode } from "@/lib/currency";

interface CurrencyDisplayContextValue {
  selectedCurrencies: CurrencyCode[];
  toggleCurrency: (currency: CurrencyCode) => void;
}

const defaultCurrencies: CurrencyCode[] = ["SAR", "JOD", "USD"];
const CurrencyDisplayContext = createContext<CurrencyDisplayContextValue | undefined>(undefined);

export function CurrencyDisplayProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyCode[]>(defaultCurrencies);

  function toggleCurrency(currency: CurrencyCode) {
    setSelectedCurrencies((current) => {
      if (current.includes(currency)) {
        return current.length === 1 ? current : current.filter((item) => item !== currency);
      }

      return defaultCurrencies.filter((item) => item === currency || current.includes(item));
    });
  }

  const value = useMemo(
    () => ({
      selectedCurrencies,
      toggleCurrency,
    }),
    [selectedCurrencies],
  );

  return <CurrencyDisplayContext.Provider value={value}>{children}</CurrencyDisplayContext.Provider>;
}

export function useCurrencyDisplay() {
  const context = useContext(CurrencyDisplayContext);

  if (!context) {
    throw new Error("useCurrencyDisplay must be used within CurrencyDisplayProvider");
  }

  return context;
}

