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
import { getInventory, getSources, getStockRules } from "@/services/inventoryApi";
import type { InventoryFilters } from "@/types/filters";
import type {
  AggregatedStockItem,
  ApiMeta,
  CounterScreenSource,
  DashboardSummary,
  InventoryAlert,
  InventoryItem,
  InventorySummary,
  LogisticsStatus,
  MultiLocationReport,
  ReplenishmentSuggestion,
  SalesPerformanceResponse,
  StockRule,
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
  getMultiLocation: (filters: InventoryFilters) => MultiLocationReport;
}

const InventoryDataContext = createContext<InventoryDataContextValue | undefined>(undefined);

export function InventoryDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [sources, setSources] = useState<CounterScreenSource[]>([]);
  const [stockRules, setStockRules] = useState<StockRule[]>([]);
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
      const [inventoryResponse, sourceResponse, stockRulesResponse] = await Promise.all([
        getInventory({ refresh }),
        getSources(),
        getStockRules().catch(() => []),
      ]);
      setInventoryItems(inventoryResponse.data);
      setMeta(inventoryResponse.meta);
      setSources(sourceResponse);
      setStockRules(stockRulesResponse);
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
        calculateDashboardSummary(getFilteredData(filters), meta?.generatedAt ?? new Date().toISOString(), meta?.errors ?? [], stockRules),
      getAlerts: (filters) => calculateAlerts(getFilteredData(filters), meta?.generatedAt ?? new Date().toISOString(), meta?.errors ?? [], stockRules),
      getReplenishment: (filters) => calculateReplenishment(getFilteredData(filters), stockRules),
      getStockCoverage: (filters) => calculateStockCoverage(getFilteredData(filters), stockRules),
      getSalesPerformance: (filters) => calculateSalesPerformance(getFilteredData(filters)),
      getAggregatedStock: (filters) => calculateAggregatedStock(getFilteredData(filters)),
      getLogistics: (filters) => calculateLogistics(getFilteredData(filters)),
      getMultiLocation: (filters) => calculateMultiLocation(getFilteredData(filters), stockRules),
    }),
    [error, getFilteredData, inventoryItems, isInitialLoading, isRefreshing, loadData, meta, sources, stockRules],
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
