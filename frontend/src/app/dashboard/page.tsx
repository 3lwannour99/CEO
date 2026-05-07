"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { MetaStrip } from "@/components/MetaStrip/MetaStrip";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber, formatValue } from "@/lib/apiClient";
import { formatMoneyTotalsCompact } from "@/lib/currency";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type { DashboardMetric, InventoryAlert, InventoryItem, LocationStock, LogisticsStatus, SalesPerformanceItem } from "@/types/inventory";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const data = useMemo(() => inventoryData.getDashboardSummary(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const metrics: DashboardMetric[] = [
    { label: t("metrics.totalStockUnits"), value: formatNumber(data.metrics.totalUnits), trend: t("metrics.totalTrend"), tone: "positive" },
    { label: t("table.currentStock"), value: formatNumber(data.metrics.currentStockUnits), trend: t("summary.liveData"), tone: "neutral" },
    { label: t("metrics.fastMovingStock"), value: formatNumber(data.metrics.fastMovingUnits), trend: t("metrics.fastTrend"), tone: "positive" },
    { label: t("metrics.mediumMovingStock"), value: formatNumber(data.metrics.mediumMovingUnits), trend: t("metrics.mediumTrend"), tone: "neutral" },
    { label: t("metrics.slowMovingStock"), value: formatNumber(data.metrics.slowMovingUnits), trend: t("metrics.slowTrend"), tone: "warning" },
    { label: t("metrics.stockCoverageMonths"), value: formatValue(data.metrics.stockCoverageMonths), trend: t("metrics.coverageTrend"), tone: "positive" },
    { label: t("metrics.reservedUnits"), value: formatNumber(data.metrics.reservedUnits), trend: t("metrics.reservedTrend"), tone: "neutral" },
    { label: t("metrics.inTransitUnits"), value: formatNumber(data.metrics.inTransitUnits), trend: t("metrics.transitTrend"), tone: "warning" },
  ];
  const inventoryColumns: DataTableColumn<InventoryItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "age", header: t("table.stockAgeDays"), render: (row) => formatValue(row.stockAgeDays) },
    { key: "velocity", header: t("table.movementCategory"), render: (row) => <StatusBadge tone={row.movementCategory} /> },
    { key: "source", header: t("table.source"), render: (row) => row.sourceName },
  ];
  const alertColumns: DataTableColumn<InventoryAlert>[] = [
    { key: "title", header: t("table.alert"), render: (row) => row.title },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "severity", header: t("table.severity"), render: (row) => <StatusBadge tone={row.severity} /> },
    { key: "created", header: t("table.created"), render: (row) => row.createdAt },
  ];
  const locationColumns: DataTableColumn<LocationStock>[] = [
    { key: "location", header: t("sections.locations"), render: (row) => formatValue(row.location) },
    { key: "available", header: t("table.available"), render: (row) => formatNumber(row.available) },
    { key: "reserved", header: t("table.reserved"), render: (row) => formatNumber(row.reserved) },
    { key: "transit", header: t("table.transit"), render: (row) => formatNumber(row.inTransit) },
    { key: "slow", header: t("table.slow"), render: (row) => formatNumber(row.slowMoving) },
  ];
  const salesColumns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies) },
  ];
  const logisticsColumns: DataTableColumn<LogisticsStatus>[] = [
    { key: "po", header: t("table.po"), render: (row) => formatValue(row.poNo) },
    { key: "status", header: t("table.status"), render: (row) => row.status },
    { key: "eta", header: t("table.eta"), render: (row) => formatValue(row.estimatedArrival ?? row.eta) },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.units) },
  ];

  return (
    <>
      <PageHeader title={t("pages.dashboard.title")} description={t("pages.dashboard.description")} meta={t("summary.liveData")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <MetaStrip meta={inventoryData.meta} />
      <ApiState
        loading={inventoryData.isInitialLoading}
        refreshing={inventoryData.isRefreshing}
        error={inventoryData.error}
        partial={(inventoryData.meta?.failedSources ?? 0) > 0}
        empty={!inventoryData.isInitialLoading && filteredItems.length === 0}
        onRetry={() => void inventoryData.refreshData()}
        onReset={resetFilters}
      />
      <section className={styles.metricGrid}>
        {metrics.map((metric) => (
          <DashboardCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className={styles.sectionGrid}>
        <SectionCard title={t("sections.inventoryStatusSummary")} eyebrow={t("sections.stockHealth")}>
          <div className={styles.summaryList}>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.readyStock")}</span><span className={styles.summaryValue}>{formatValue(data.inventoryStatusSummary.readyPercent)}%</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.reservedStock")}</span><span className={styles.summaryValue}>{formatNumber(data.inventoryStatusSummary.reservedUnits)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.serviceHold")}</span><span className={styles.summaryValue}>{formatNumber(data.inventoryStatusSummary.serviceHoldUnits)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.averageCoverage")}</span><span className={styles.summaryValue}>{formatValue(data.inventoryStatusSummary.averageCoverageMonths)}</span></div>
          </div>
        </SectionCard>
        <SectionCard title={t("sections.topSellingModels")} eyebrow={t("sections.sales")}>
          <DataTable columns={salesColumns} rows={data.topSellingModels} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
        <SectionCard title={t("sections.slowStockList")} eyebrow={t("sections.inventoryMovement")}>
          <DataTable columns={inventoryColumns} rows={data.slowStockList} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
        <SectionCard title={t("sections.recentAlerts")} eyebrow={t("sections.autoAlerts")}>
          <DataTable columns={alertColumns} rows={data.recentAlerts} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
        <SectionCard title={t("sections.stockByLocation")} eyebrow={t("sections.multiLocation")}>
          <DataTable columns={locationColumns} rows={data.stockByLocation} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
        <SectionCard title={t("sections.logisticsStatusSnapshot")} eyebrow={t("sections.inbound")}>
          <DataTable columns={logisticsColumns} rows={data.logisticsStatusSnapshot} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
        </SectionCard>
      </section>
    </>
  );
}



