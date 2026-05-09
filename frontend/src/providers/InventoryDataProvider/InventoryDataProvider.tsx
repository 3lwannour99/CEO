"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useInventorySocket } from "@/hooks/useInventorySocket";
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
  InventoryLiveStatus,
  InventoryRefreshReason,
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
  hasSuccessfulData: boolean;
  lastRefreshFailedAt: string | null;
  lastRefreshStartedAt: string | null;
  liveStatus: InventoryLiveStatus;
  isSocketConnected: boolean;
  syncStatus?: string;
  meta?: ApiMeta;
  lastUpdated?: string;
  refreshData: (reason?: InventoryRefreshReason) => Promise<void>;
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

interface InventoryRefreshRequest {
  reason: InventoryRefreshReason;
  triggerSync?: boolean;
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
  const [hasSuccessfulData, setHasSuccessfulData] = useState(false);
  const [lastRefreshFailedAt, setLastRefreshFailedAt] = useState<string | null>(null);
  const [lastRefreshStartedAt, setLastRefreshStartedAt] = useState<string | null>(null);
  const hasSuccessfulDataRef = useRef(false);
  const inFlightRefreshRef = useRef<Promise<void> | null>(null);
  const latestRequestIdRef = useRef(0);

  const refreshInventoryData = useCallback(async ({ reason, triggerSync = false }: InventoryRefreshRequest) => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    const hasExistingData = hasSuccessfulDataRef.current;
    const isBackgroundRefresh = reason !== "initial-load";
    const shouldTriggerBackendSync = reason === "manual-refresh" && triggerSync;
    const startedAt = new Date().toISOString();

    setLastRefreshStartedAt(startedAt);

    if (isBackgroundRefresh && hasExistingData) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    setError(null);

    const request = (async () => {
      try {
        const [inventoryResult, sourcesResult, stockRulesResult] = await Promise.allSettled([
          getInventory(shouldTriggerBackendSync ? { refresh: true } : undefined),
          getSources(),
          getStockRules(),
        ]);

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (inventoryResult.status === "rejected") {
          throw inventoryResult.reason;
        }

        setInventoryItems(inventoryResult.value.data);
        setMeta(inventoryResult.value.meta);

        if (sourcesResult.status === "fulfilled") {
          setSources(sourcesResult.value);
        }

        if (stockRulesResult.status === "fulfilled") {
          setStockRules(stockRulesResult.value);
        }

        const supportingErrors = [sourcesResult, stockRulesResult]
          .filter((result) => result.status === "rejected")
          .map((result) => (result as PromiseRejectedResult).reason)
          .map((reasonValue) => (reasonValue instanceof Error ? reasonValue.message : "Supporting API request failed."));

        setError(supportingErrors[0] ?? null);
        hasSuccessfulDataRef.current = true;
        setHasSuccessfulData(true);
        setLastRefreshFailedAt(null);
      } catch (loadError) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "API error");
        setLastRefreshFailedAt(new Date().toISOString());
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
          inFlightRefreshRef.current = null;
        }
      }
    })();

    inFlightRefreshRef.current = request;
    return request;
  }, []);

  const liveStatus = useInventorySocket({
    onInventoryUpdated: () => {
      void refreshInventoryData({ reason: "websocket-update", triggerSync: false });
    },
  });

  useEffect(() => {
    void refreshInventoryData({ reason: "initial-load", triggerSync: false });
  }, [refreshInventoryData]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && hasSuccessfulDataRef.current) {
        void refreshInventoryData({ reason: "visibility-return", triggerSync: false });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshInventoryData]);

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
      isBusy: isInitialLoading,
      error,
      hasSuccessfulData,
      lastRefreshFailedAt,
      lastRefreshStartedAt,
      liveStatus,
      isSocketConnected: liveStatus.connected,
      syncStatus: liveStatus.lastEvent?.status ?? meta?.syncStatus,
      meta,
      lastUpdated: meta?.generatedAt,
      refreshData: (reason = "manual-refresh") => refreshInventoryData({ reason, triggerSync: reason === "manual-refresh" }),
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
    [
      error,
      getFilteredData,
      hasSuccessfulData,
      inventoryItems,
      isInitialLoading,
      isRefreshing,
      lastRefreshFailedAt,
      lastRefreshStartedAt,
      liveStatus,
      meta,
      refreshInventoryData,
      sources,
      stockRules,
    ],
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
