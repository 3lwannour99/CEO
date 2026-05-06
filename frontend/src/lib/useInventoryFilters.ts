"use client";

import { useCallback, useEffect, useState } from "react";
import { getSources } from "@/services/inventoryApi";
import type { CounterScreenSource, InventoryFilters } from "@/types/inventory";

export function useInventoryFilters() {
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [sources, setSources] = useState<CounterScreenSource[]>([]);

  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => setSources([]));
  }, []);

  const forceRefreshFilters = useCallback(() => {
    setFilters((current) => ({
      ...current,
      refresh: true,
    }));
  }, []);

  return { filters, setFilters, sources, forceRefreshFilters };
}
