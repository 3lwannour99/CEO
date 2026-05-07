"use client";

import { createContext, useCallback, useMemo, useState } from "react";
import { createDefaultInventoryFilters, type InventoryFilters } from "@/types/filters";

interface FilterContextValue {
  filters: InventoryFilters;
  setFilters: (filters: InventoryFilters) => void;
  resetFilters: () => void;
  clearAllFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<InventoryFilters>(() => createDefaultInventoryFilters());

  const resetFilters = useCallback(() => {
    setFilters(createDefaultInventoryFilters());
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      sourceIds: [],
      countries: [],
      brands: [],
      models: [],
      modelYears: [],
      types: [],
      exteriorColors: [],
      interiorColors: [],
      wheels: [],
      branches: [],
      warehouses: [],
      statuses: [],
      movementCategories: [],
      readyStatuses: [],
      customerGroups: [],
      salesmen: [],
      search: "",
      dateField: "arInvoiceDate",
      fromDate: undefined,
      toDate: undefined,
      exactDate: undefined,
      datePreset: "",
    });
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      resetFilters,
      clearAllFilters,
    }),
    [clearAllFilters, filters, resetFilters],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export { FilterContext };
