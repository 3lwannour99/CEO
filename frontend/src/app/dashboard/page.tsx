"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DonutChartCard } from "@/components/charts/DonutChartCard/DonutChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard/LineChartCard";
import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { MetaStrip } from "@/components/MetaStrip/MetaStrip";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { DASHBOARD_STATUS_CARDS } from "@/constants/statusCards";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatDate, formatNumber, formatValue } from "@/lib/apiClient";
import { buildSalesRevenueTrendByDateFilter, groupByModel, groupByMovementCategory, groupBySource, groupByStatus, groupSalesUnitsByDateFilter } from "@/lib/chartMetrics";
import { formatCurrency, formatMoneyBundle, formatMoneyTotalsCompact } from "@/lib/currency";
import { exportExcel } from "@/lib/exportData";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type {
  DashboardMetric,
  InventoryAlert,
  InventoryItem,
  LocationStock,
  LogisticsStatus,
  SalesPerformanceItem,
  SlowStockSummaryItem,
} from "@/types/inventory";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const data = useMemo(() => inventoryData.getDashboardSummary(filters), [filters, inventoryData]);
  const filteredItems = useMemo(
    () => inventoryData.getFilteredData(filters),
    [filters, inventoryData],
  );
  const unitsByStatus = useMemo(() => groupByStatus(filteredItems), [filteredItems]);
  const movementByCategory = useMemo(() => groupByMovementCategory(filteredItems), [filteredItems]);
  const stockBySource = useMemo(() => groupBySource(filteredItems, 10), [filteredItems]);
  const topModelsByUnits = useMemo(() => groupByModel(filteredItems, 10), [filteredItems]);
  const salesTrend = useMemo(() => groupSalesUnitsByDateFilter(filteredItems, filters), [filteredItems, filters]);
  const salesRevenueTrend = useMemo(() => buildSalesRevenueTrendByDateFilter(filteredItems, filters), [filteredItems, filters]);
  const revenueCurrencyKeys = useMemo(() => selectedCurrencies.map((currency) => currency.toLowerCase()), [selectedCurrencies]);
  const revenueLabels = useMemo(() => ({ sar: t("charts.revenueSar"), jod: t("charts.revenueJod"), usd: t("charts.revenueUsd") }), [t]);
  const latestRevenue = salesRevenueTrend.at(-1);
  const primaryRevenueCurrency = selectedCurrencies[0] ?? "USD";
  const selectedStatuses = useMemo(
    () => new Set(filters.statuses.map(normalizeStatusValue)),
    [filters.statuses],
  );
  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        DASHBOARD_STATUS_CARDS.map((card) => [
          card.statusValue,
          filteredItems
            .filter((item) => itemMatchesStatusCard(item, card.statusValue))
            .reduce((sum, item) => sum + (item.quantity || 1), 0),
        ]),
      ),
    [filteredItems],
  );

  function applyStatusFilter(statusValue: string) {
    const normalized = normalizeStatusValue(statusValue);
    const alreadySelected = selectedStatuses.has(normalized);

    const nextStatuses = alreadySelected
      ? filters.statuses.filter((status) => normalizeStatusValue(status) !== normalized)
      : [...filters.statuses, statusValue];

    setFilters({ ...filters, statuses: nextStatuses });
  }

  function clearStatusFilter() {
    setFilters({ ...filters, statuses: [] });
  }

  const percentOfStock = (value: number | undefined) =>
    data.metrics.currentStockUnits > 0
      ? `${formatNumber(Math.round(((value ?? 0) / data.metrics.currentStockUnits) * 100))}% ${t("table.currentStock")}`
      : formatValue(null);
  const metrics: DashboardMetric[] = [
    {
      label: t("metrics.totalReportRows"),
      value: formatNumber(data.metrics.totalRows),
      trend: t("metrics.allRowsIncludingDuplicates"),
      tone: "neutral",
    },
    {
      label: t("metrics.uniqueChassis"),
      value: formatNumber(data.metrics.uniqueChassisCount),
      trend: t("metrics.distinctPhysicalVehicles"),
      tone: "positive",
    },
    {
      label: t("metrics.multiStatusChassis"),
      value: formatNumber(data.metrics.multiStatusChassisCount),
      trend: t("metrics.chassisWithMultipleRecords"),
      tone: "warning",
    },
    {
      label: t("metrics.rowsInMultiStatusGroups"),
      value: formatNumber(data.metrics.rowsInMultiStatusChassisGroups),
      trend: t("metrics.duplicateImpact"),
      tone: "warning",
    },
    {
      label: t("metrics.totalStockUnits"),
      value: formatNumber(data.metrics.currentStockUnits),
      trend: `${formatNumber(filteredItems.length)} ${t("table.total")} ${t("table.units")}`,
      tone: "positive",
    },
    {
      label: t("table.currentStock"),
      value: formatNumber(data.metrics.currentStockUnits),
      trend: percentOfStock(data.metrics.currentStockUnits),
      tone: "neutral",
    },
    {
      label: t("metrics.fastMovingStock"),
      value: formatNumber(data.metrics.fastMovingUnits),
      trend: percentOfStock(data.metrics.fastMovingUnits),
      tone: "positive",
    },
    {
      label: t("metrics.mediumMovingStock"),
      value: formatNumber(data.metrics.mediumMovingUnits),
      trend: percentOfStock(data.metrics.mediumMovingUnits),
      tone: "neutral",
    },
    {
      label: t("metrics.slowMovingStock"),
      value: formatNumber(data.metrics.slowMovingUnits),
      trend: percentOfStock(data.metrics.slowMovingUnits),
      tone: "warning",
    },
    {
      label: t("metrics.stockCoverageMonths"),
      value: formatValue(data.metrics.stockCoverageMonths),
      trend:
        data.metrics.stockCoverageMonths === null
          ? t("status.unknown")
          : `${formatNumber(data.metrics.soldUnits)} ${t("table.soldUnits")}`,
      tone: "positive",
    },
    {
      label: t("table.sellThroughRate"),
      value: `${formatNumber(data.metrics.sellThroughRate)}%`,
      trend: t("sections.sales"),
      tone: "positive",
    },
    {
      label: t("table.inventoryTurnover"),
      value: formatNumber(data.metrics.inventoryTurnover),
      trend: t("sections.sales"),
      tone: "neutral",
    },
    {
      label: t("sections.autoAlerts"),
      value: formatNumber(data.metrics.alertCount),
      trend: t("sections.recentAlerts"),
      tone: "warning",
    },
    {
      label: t("sections.replenishmentSuggestions"),
      value: formatNumber(data.metrics.urgentReplenishmentCount),
      trend: t("table.urgency"),
      tone: "danger",
    },
    {
      label: t("table.delayedShipments"),
      value: formatNumber(data.metrics.delayedLogisticsCount),
      trend: t("sections.inbound"),
      tone: "warning",
    },
    {
      label: t("metrics.reservedUnits"),
      value: formatNumber(data.metrics.reservedUnits),
      trend: `${formatNumber(data.metrics.reservedUnits)} ${t("table.reserved")}`,
      tone: "neutral",
    },
    {
      label: t("metrics.inTransitUnits"),
      value: formatNumber(data.metrics.inTransitUnits),
      trend: `${formatNumber(data.metrics.inTransitUnits)} ${t("table.inTransit")}`,
      tone: "warning",
    },
  ];
  const inventoryColumns: DataTableColumn<SlowStockSummaryItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "type", header: t("table.type"), render: (row) => formatValue(row.type) },
    {
      key: "count",
      header: t("inventoryMovement.slowCount"),
      render: (row) => formatNumber(row.slowStockCount),
    },
    {
      key: "averageAge",
      header: t("inventoryMovement.averageDaysInStock"),
      render: (row) => formatValue(row.averageStockAge),
    },
    {
      key: "maxAge",
      header: t("table.stockAgeDays"),
      render: (row) => formatValue(row.maxStockAge),
    },
    {
      key: "warehouse",
      header: t("table.warehouse"),
      render: (row) => row.warehouses.join(", ") || "-",
    },
    { key: "branch", header: t("table.branch"), render: (row) => row.branches.join(", ") || "-" },
    { key: "source", header: t("table.source"), render: (row) => row.sources.join(", ") || "-" },
  ];
  const alertColumns: DataTableColumn<InventoryAlert>[] = [
    { key: "title", header: t("table.alert"), render: (row) => row.title },
    {
      key: "affected",
      header: t("alerts.affectedUnits"),
      render: (row) => formatNumber(row.affectedUnits ?? row.affectedCount ?? 0),
    },
    {
      key: "source",
      header: t("table.source"),
      render: (row) => formatValue(row.sourceName ?? row.branch),
    },
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    {
      key: "severity",
      header: t("table.severity"),
      render: (row) => <StatusBadge tone={row.severity} />,
    },
    {
      key: "action",
      header: t("alerts.recommendedAction"),
      render: (row) => formatValue(row.recommendedAction),
    },
  ];
  const locationColumns: DataTableColumn<LocationStock>[] = [
    {
      key: "location",
      header: t("sections.locations"),
      render: (row) => formatValue(row.location),
    },
    {
      key: "available",
      header: t("table.available"),
      render: (row) => formatNumber(row.available),
    },
    { key: "reserved", header: t("table.reserved"), render: (row) => formatNumber(row.reserved) },
    { key: "transit", header: t("table.transit"), render: (row) => formatNumber(row.inTransit) },
    { key: "slow", header: t("table.slow"), render: (row) => formatNumber(row.slowMoving) },
  ];
  const salesColumns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.unitsSold) },
    {
      key: "revenue",
      header: t("table.revenue"),
      render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies),
    },
  ];
  const logisticsColumns: DataTableColumn<LogisticsStatus>[] = [
    { key: "po", header: t("table.po"), render: (row) => formatValue(row.poNo) },
    { key: "status", header: t("table.status"), render: (row) => row.status },
    {
      key: "eta",
      header: t("table.eta"),
      render: (row) => formatValue(row.estimatedArrival ?? row.eta),
    },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.units) },
  ];
  const detailedColumns: DataTableColumn<InventoryItem>[] = [
    {
      key: "chassis",
      header: t("table.columns.chassis"),
      render: (row) => formatValue(row.chassis),
    },
    { key: "model", header: t("table.columns.model"), render: (row) => formatValue(row.model) },
    {
      key: "status",
      header: t("table.columns.status"),
      render: (row) => <StatusBadge tone={row.normalizedStatus || "unknown"} />,
      searchValue: (row) => row.displayStatus || row.rawStatus || row.normalizedStatus,
      sortValue: (row) => row.displayStatus || row.rawStatus || row.normalizedStatus,
    },

    { key: "type", header: t("table.columns.type"), render: (row) => formatValue(row.type) },
    {
      key: "exteriorColor",
      header: t("table.columns.exteriorColor"),
      render: (row) => formatValue(row.exteriorColor),
    },
    {
      key: "interiorColor",
      header: t("table.columns.interiorColor"),
      render: (row) => formatValue(row.interiorColor),
    },
    {
      key: "modelYear",
      header: t("table.columns.modelYear"),
      render: (row) => formatValue(row.modelYear),
    },
    {
      key: "company",
      header: t("table.columns.company"),
      render: (row) => formatValue(row.sourceName),
      searchValue: (row) => row.sourceName,
      sortValue: (row) => row.sourceName,
    },
    {
      key: "warehouse",
      header: t("table.columns.warehouse"),
      render: (row) => formatValue(row.warehouse),
    },
    { key: "branch", header: t("table.columns.branch"), render: (row) => formatValue(row.branch) },
    {
      key: "customer",
      header: t("table.columns.customer"),
      render: (row) => formatValue(row.customerName),
    },
    {
      key: "customerNumber",
      header: t("table.columns.customerNumber"),
      render: (row) => formatValue(row.customerNumber),
    },
    {
      key: "recipientName",
      header: t("table.columns.recipientName"),
      render: (row) => formatValue(row.recipientName || row.uTanazol),
    },
    {
      key: "recipientNumber",
      header: t("table.columns.recipientNumber"),
      render: (row) => formatValue(row.recipientNumber || row.uMobNum),
    },
    {
      key: "salesman",
      header: t("table.columns.salesman"),
      render: (row) => formatValue(row.salesMan),
    },
    {
      key: "customerGroup",
      header: t("table.columns.customerGroup"),
      render: (row) => formatValue(row.customerGroup),
    },
    {
      key: "price",
      header: t("table.columns.price"),
      render: (row) => formatPrice(row, language, selectedCurrencies),
      searchValue: (row) => row.soldPrice || row.price1 || "",
      sortValue: (row) => row.soldPrice || row.price1 || 0,
    },
    { key: "bank", header: t("table.columns.bank"), render: (row) => formatValue(row.bank) },
    {
      key: "reserveDate",
      header: t("table.columns.reserveDate"),
      render: (row) => formatDate(row.reserveDate),
      sortValue: (row) => row.reserveDate,
    },
    {
      key: "reservationAge",
      header: t("table.columns.reservationAge"),
      render: (row) => formatReservationAge(row.reserveDate, language, t),
      sortValue: (row) => reservationAgeDays(row.reserveDate) ?? -1,
    },
    {
      key: "salesDate",
      header: t("table.columns.salesDate"),
      render: (row) => formatDate(row.arInvoiceDate),
      sortValue: (row) => row.arInvoiceDate,
    },
    { key: "brand", header: t("table.columns.brand"), render: (row) => formatValue(row.brand) },
    {
      key: "itemCode",
      header: t("table.columns.itemCode"),
      render: (row) => formatValue(row.itemCode),
    },
    {
      key: "ready",
      header: t("table.columns.ready"),
      render: (row) => (row.isReadyForSale ? t("summary.yes") : t("summary.no")),
      searchValue: (row) => (row.isReadyForSale ? t("summary.yes") : t("summary.no")),
      sortValue: (row) => row.isReadyForSale,
    },
    {
      key: "arInvoiceNo",
      header: t("table.columns.arInvoiceNo"),
      render: (row) => formatValue(row.arInvoiceNo),
    },
    {
      key: "daysInStock",
      header: t("table.columns.daysInStock"),
      render: (row) => formatValue(row.stockAgeDays),
      sortValue: (row) => row.stockAgeDays ?? -1,
    },
  ];
  const detailedExportRows = useMemo(
    () =>
      filteredItems.map((row) => ({
        [t("table.columns.status")]: row.displayStatus || row.rawStatus || row.normalizedStatus,
        [t("table.columns.model")]: row.model,
        [t("table.columns.type")]: row.type,
        [t("table.columns.chassis")]: row.chassis,
        [t("table.columns.exteriorColor")]: row.exteriorColor,
        [t("table.columns.interiorColor")]: row.interiorColor,
        [t("table.columns.modelYear")]: row.modelYear,
        [t("table.columns.company")]: row.sourceName,
        [t("table.columns.warehouse")]: row.warehouse,
        [t("table.columns.branch")]: row.branch,
        [t("table.columns.customer")]: row.customerName,
        [t("table.columns.customerNumber")]: row.customerNumber,
        [t("table.columns.recipientName")]: row.recipientName || row.uTanazol,
        [t("table.columns.recipientNumber")]: row.recipientNumber || row.uMobNum,
        [t("table.columns.salesman")]: row.salesMan,
        [t("table.columns.customerGroup")]: row.customerGroup,
        [t("table.columns.price")]: formatPrice(row, language, selectedCurrencies),
        [t("table.columns.bank")]: row.bank,
        [t("table.columns.reserveDate")]: formatDate(row.reserveDate),
        [t("table.columns.reservationAge")]: formatReservationAge(row.reserveDate, language, t),
        [t("table.columns.salesDate")]: formatDate(row.arInvoiceDate),
        [t("table.columns.brand")]: row.brand,
        [t("table.columns.itemCode")]: row.itemCode,
        [t("table.columns.ready")]: row.isReadyForSale ? t("summary.yes") : t("summary.no"),
        [t("table.columns.arInvoiceNo")]: row.arInvoiceNo,
        [t("table.columns.daysInStock")]: row.stockAgeDays ?? "",
      })),
    [filteredItems, language, selectedCurrencies, t],
  );

  return (
    <>
      <PageHeader
        title={t("pages.dashboard.title")}
        description={t("pages.dashboard.description")}
        meta={t("summary.liveData")}
      />
      <FilterBar
        filters={filters}
        inventoryItems={inventoryData.inventoryItems}
        sources={inventoryData.sources}
        onChange={setFilters}
      />
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
      <SectionCard
        title={t("dashboard.statusCards.title")}
        eyebrow={t("dashboard.statusCards.description")}
      >
        {filters.statuses.length > 0 ? (
          <div className="report-actions">
            <button
              className="report-button"
              type="button"
              onClick={clearStatusFilter}
              disabled={inventoryData.isInitialLoading}
            >
              {t("dashboard.statusCards.clearStatusFilter")}
            </button>
          </div>
        ) : null}
        <section className={styles.metricGrid} aria-label={t("dashboard.statusCards.title")}>
          {DASHBOARD_STATUS_CARDS.map((card) => {
            const isActive = selectedStatuses.has(normalizeStatusValue(card.statusValue));
            return (
              <DashboardCard
                key={card.key}
                label={t(card.labelKey)}
                value={formatNumber(statusCounts[card.statusValue] ?? 0)}
                trend={
                  isActive
                    ? t("dashboard.statusCards.activeFilter")
                    : t("dashboard.statusCards.description")
                }
                tone={card.tone}
                onClick={() => applyStatusFilter(card.statusValue)}
                isActive={isActive}
                disabled={inventoryData.isInitialLoading}
              />
            );
          })}
        </section>
      </SectionCard>
      <section className={styles.metricGrid}>
        {metrics.map((metric) => (
          <DashboardCard key={metric.label} {...metric} />
        ))}
      </section>
      <ChartGrid>
        <DonutChartCard title={t("charts.unitsByStatus")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(data.metrics.currentStockUnits)} ${t("table.currentStock")}`} data={unitsByStatus} isLoading={inventoryData.isInitialLoading} />
        <DonutChartCard title={t("charts.movementCategory")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(data.metrics.slowMovingUnits)} ${t("table.slow")}`} data={movementByCategory} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.stockByCompany")} subtitle={t("charts.top10")} insight={`${formatNumber(stockBySource[0]?.value ?? 0)} ${stockBySource[0]?.name ?? ""}`} data={stockBySource} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.topModelsByUnits")} subtitle={t("charts.top10")} insight={`${formatNumber(topModelsByUnits[0]?.value ?? 0)} ${topModelsByUnits[0]?.name ?? ""}`} data={topModelsByUnits} isLoading={inventoryData.isInitialLoading} />
        <LineChartCard title={t("charts.salesUnitsTrend")} subtitle={t("charts.liveFilteredData")} insight={`${formatNumber(data.metrics.soldUnits)} ${t("table.soldUnits")}`} data={salesTrend} keys={["sold"]} isLoading={inventoryData.isInitialLoading} />
        <LineChartCard title={t("charts.salesRevenueTrend")} subtitle={t("charts.liveFilteredData")} insight={formatCurrency(getRevenueTrendValue(latestRevenue, primaryRevenueCurrency), primaryRevenueCurrency, language)} data={salesRevenueTrend} keys={revenueCurrencyKeys} labels={revenueLabels} valueFormatter={(value, key) => formatRevenueTrendValue(value, key, language)} yAxisFormatter={(value) => formatCompactMoney(value, language)} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.stockHealth")} subtitle={t("sections.stockHealth")} insight={`${formatValue(data.metrics.stockCoverageMonths)} ${t("summary.months")}`} data={[
          { name: t("status.fast"), value: data.metrics.fastMovingUnits },
          { name: t("status.medium"), value: data.metrics.mediumMovingUnits },
          { name: t("status.slow"), value: data.metrics.slowMovingUnits },
        ]} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>
      <section className={styles.sectionGrid}>
        <SectionCard
          title={t("sections.inventoryStatusSummary")}
          eyebrow={t("sections.stockHealth")}
        >
          <div className={styles.summaryList}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t("summary.readyStock")}</span>
              <span className={styles.summaryValue}>
                {formatValue(data.inventoryStatusSummary.readyPercent)}%
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t("summary.reservedStock")}</span>
              <span className={styles.summaryValue}>
                {formatNumber(data.inventoryStatusSummary.reservedUnits)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t("summary.serviceHold")}</span>
              <span className={styles.summaryValue}>
                {formatNumber(data.inventoryStatusSummary.serviceHoldUnits)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t("summary.averageCoverage")}</span>
              <span className={styles.summaryValue}>
                {formatValue(data.inventoryStatusSummary.averageCoverageMonths)}
              </span>
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title={t("sections.topSellingModels")}
          eyebrow={t("sections.sales")}
          action={t("sections.top10")}
        >
          <DataTable
            columns={salesColumns}
            rows={data.topSellingModels}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
        </SectionCard>
        <SectionCard
          title={t("sections.bottomSellingModels")}
          eyebrow={t("sections.sales")}
          action={t("sections.top10")}
        >
          <DataTable
            columns={salesColumns}
            rows={data.bottomSellingModels ?? []}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
        </SectionCard>
        <SectionCard
          title={t("sections.slowStockList")}
          eyebrow={t("sections.inventoryMovement")}
          action={formatNumber(data.slowStockList.length)}
        >
          <DataTable
            columns={inventoryColumns}
            rows={data.slowStockList}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
        </SectionCard>
        <SectionCard
          title={t("sections.recentAlerts")}
          eyebrow={t("sections.autoAlerts")}
          action={formatNumber(data.recentAlerts.length)}
        >
          <p>{t("alerts.topAlertsOnly")}</p>
          <DataTable
            columns={alertColumns}
            rows={data.recentAlerts}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
          <div className="report-actions">
            <a className="report-button" href="/alerts">
              {t("dashboard.viewAll")}
            </a>
          </div>
        </SectionCard>
        <SectionCard title={t("sections.stockByLocation")} eyebrow={t("sections.multiLocation")}>
          <DataTable
            columns={locationColumns}
            rows={data.stockByLocation}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
        </SectionCard>
        <SectionCard title={t("sections.logisticsStatusSnapshot")} eyebrow={t("sections.inbound")}>
          <DataTable
            columns={logisticsColumns}
            rows={data.logisticsStatusSnapshot}
            isLoading={inventoryData.isInitialLoading}
            emptyMessage={t("filters.emptyFiltered")}
          />
        </SectionCard>
      </section>
      <div className="report-actions">
        <button
          className="report-button primary"
          type="button"
          onClick={() => exportExcel("detailed-vehicle-list.xlsx", detailedExportRows)}
          disabled={inventoryData.isInitialLoading}
        >
          {t("actions.exportExcel")}
        </button>
      </div>
      <SectionCard
        title={t("dashboard.detailedVehicleList.title")}
        eyebrow={t("dashboard.detailedVehicleList.description")}
        action={formatNumber(filteredItems.length)}
      >
        <DataTable
          columns={detailedColumns}
          rows={filteredItems}
          maxVisibleRows={15}
          isLoading={inventoryData.isInitialLoading}
          emptyMessage={t("filters.emptyFiltered")}
        />
      </SectionCard>
    </>
  );
}

function normalizeStatusValue(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z-]/g, "")
    .replace(/-/g, "");
}

function itemMatchesStatusCard(item: InventoryItem, statusValue: string) {
  const target = normalizeStatusValue(statusValue);
  return [item.normalizedStatus, item.rawStatus, item.displayStatus, item.chassisStatus].some(
    (value) => normalizeStatusValue(String(value ?? "")) === target,
  );
}

function reservationAgeDays(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

function formatReservationAge(
  value: string | null | undefined,
  language: string,
  t: (key: string) => string,
) {
  const days = reservationAgeDays(value);
  return days === null ? "-" : `${new Intl.NumberFormat(language).format(days)} ${t("table.days")}`;
}

function formatPrice(
  row: InventoryItem,
  language: string,
  selectedCurrencies: Parameters<typeof formatMoneyTotalsCompact>[2],
) {
  const amount = row.soldPrice > 0 ? row.soldPrice : row.price1;
  return formatMoneyBundle(amount, row, language, selectedCurrencies);
}

function formatRevenueTrendValue(value: number, key: string, language: string) {
  const currency = key.toLowerCase().includes("sar") ? "SAR" : key.toLowerCase().includes("jod") ? "JOD" : "USD";
  return formatCurrency(value, currency, language);
}

function formatCompactMoney(value: number, language: string) {
  return new Intl.NumberFormat(language, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getRevenueTrendValue(row: { sar: number; jod: number; usd: number } | undefined, currency: "SAR" | "JOD" | "USD") {
  if (!row) {
    return 0;
  }

  return currency === "SAR" ? row.sar : currency === "JOD" ? row.jod : row.usd;
}
