"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { filterInventory } from "@/lib/filterInventory";
import {
  calculateAggregatedStock,
  calculateAlerts,
  calculateDashboardSummary,
  calculateInventorySummary,
  calculateLogistics,
  calculateMultiLocation,
  calculateReplenishment,
  calculateSalesPerformance,
  calculateStockCoverage,
} from "@/lib/reports/inventoryReports";
import { getInventory, getSources } from "@/services/inventoryApi";
import type { InventoryFilters } from "@/types/filters";
import type {
  AggregatedStockItem,
  ApiMeta,
  CounterScreenSource,
  DashboardSummary,
  InventoryAlert,
  InventoryItem,
  InventorySummary,
  LocationStock,
  LogisticsStatus,
  ReplenishmentSuggestion,
  SalesPerformanceResponse,
  StockCoverageItem,
} from "@/types/inventory";

interface InventoryDataContextValue {
  inventoryItems: InventoryItem[];
  sources: CounterScreenSource[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isBusy: boolean;
  error: string | null;
  meta?: ApiMeta;
  lastUpdated?: string;
  refreshData: () => Promise<void>;
  getFilteredData: (filters: InventoryFilters) => InventoryItem[];
  getInventorySummary: (filters: InventoryFilters) => InventorySummary;
  getDashboardSummary: (filters: InventoryFilters) => DashboardSummary;
  getAlerts: (filters: InventoryFilters) => InventoryAlert[];
  getReplenishment: (filters: InventoryFilters) => ReplenishmentSuggestion[];
  getStockCoverage: (filters: InventoryFilters) => StockCoverageItem[];
  getSalesPerformance: (filters: InventoryFilters) => SalesPerformanceResponse;
  getAggregatedStock: (filters: InventoryFilters) => AggregatedStockItem[];
  getLogistics: (filters: InventoryFilters) => LogisticsStatus[];
  getMultiLocation: (filters: InventoryFilters) => LocationStock[];
}

const InventoryDataContext = createContext<InventoryDataContextValue | undefined>(undefined);

export function InventoryDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [sources, setSources] = useState<CounterScreenSource[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    setError(null);

    try {
      const [inventoryResponse, sourceResponse] = await Promise.all([
        getInventory({ refresh }),
        getSources(),
      ]);
      setInventoryItems(inventoryResponse.data);
      setMeta(inventoryResponse.meta);
      setSources(sourceResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "API error");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadData(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadData]);

  const filteredDataCacheRef = useRef(new Map<string, InventoryItem[]>());

  useEffect(() => {
    filteredDataCacheRef.current = new Map();
  }, [inventoryItems]);

  const getFilteredData = useCallback(
    (filters: InventoryFilters) => {
      const cacheKey = JSON.stringify(filters);
      const cached = filteredDataCacheRef.current.get(cacheKey);

      if (cached) {
        return cached;
      }

      const filteredData = filterInventory(inventoryItems, filters);
      filteredDataCacheRef.current.set(cacheKey, filteredData);

      return filteredData;
    },
    [inventoryItems],
  );

  const value = useMemo<InventoryDataContextValue>(
    () => ({
      inventoryItems,
      sources,
      isInitialLoading,
      isRefreshing,
      isBusy: isInitialLoading || isRefreshing,
      error,
      meta,
      lastUpdated: meta?.generatedAt,
      refreshData: () => loadData(true),
      getFilteredData,
      getInventorySummary: (filters) => calculateInventorySummary(getFilteredData(filters)),
      getDashboardSummary: (filters) =>
        calculateDashboardSummary(getFilteredData(filters), meta?.generatedAt ?? new Date().toISOString(), meta?.errors ?? []),
      getAlerts: (filters) => calculateAlerts(getFilteredData(filters), meta?.generatedAt ?? new Date().toISOString(), meta?.errors ?? []),
      getReplenishment: (filters) => calculateReplenishment(getFilteredData(filters)),
      getStockCoverage: (filters) => calculateStockCoverage(getFilteredData(filters)),
      getSalesPerformance: (filters) => calculateSalesPerformance(getFilteredData(filters)),
      getAggregatedStock: (filters) => calculateAggregatedStock(getFilteredData(filters)),
      getLogistics: (filters) => calculateLogistics(getFilteredData(filters)),
      getMultiLocation: (filters) => calculateMultiLocation(getFilteredData(filters)),
    }),
    [error, getFilteredData, inventoryItems, isInitialLoading, isRefreshing, loadData, meta, sources],
  );

  return <InventoryDataContext.Provider value={value}>{children}</InventoryDataContext.Provider>;
}

export function useInventoryDataContext() {
  const context = useContext(InventoryDataContext);
  if (!context) {
    throw new Error("useInventoryData must be used within InventoryDataProvider");
  }

  return context;
}
