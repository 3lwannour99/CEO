"use client";

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { alerts, inventoryItems, locationStocks, logisticsStatuses, salesPerformance } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { DashboardMetric, InventoryAlert, InventoryItem, LocationStock, LogisticsStatus, SalesPerformanceItem } from "@/types/inventory";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { t } = useI18n();
  const metrics: DashboardMetric[] = [
    { label: t("metrics.totalStockUnits"), value: "1,284", trend: t("metrics.totalTrend"), tone: "positive" },
    { label: t("metrics.fastMovingStock"), value: "462", trend: t("metrics.fastTrend"), tone: "positive" },
    { label: t("metrics.mediumMovingStock"), value: "517", trend: t("metrics.mediumTrend"), tone: "neutral" },
    { label: t("metrics.slowMovingStock"), value: "305", trend: t("metrics.slowTrend"), tone: "warning" },
    { label: t("metrics.stockCoverageMonths"), value: "3.7", trend: t("metrics.coverageTrend"), tone: "positive" },
    { label: t("metrics.soldUnitsThisMonth"), value: "188", trend: t("metrics.soldTrend"), tone: "positive" },
    { label: t("metrics.reservedUnits"), value: "96", trend: t("metrics.reservedTrend"), tone: "neutral" },
    { label: t("metrics.inTransitUnits"), value: "143", trend: t("metrics.transitTrend"), tone: "warning" },
  ];
  const inventoryColumns: DataTableColumn<InventoryItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "qty", header: t("table.qty"), render: (row) => row.quantity },
    { key: "velocity", header: t("table.movement"), render: (row) => <StatusBadge tone={row.movementVelocity} /> },
    { key: "coverage", header: t("table.coverage"), render: (row) => `${row.coverageMonths} ${t("summary.months")}` },
  ];
  const alertColumns: DataTableColumn<InventoryAlert>[] = [
    { key: "title", header: t("table.alert"), render: (row) => row.title },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch },
    { key: "severity", header: t("table.severity"), render: (row) => <StatusBadge tone={row.severity} /> },
    { key: "created", header: t("table.created"), render: (row) => row.createdAt },
  ];
  const locationColumns: DataTableColumn<LocationStock>[] = [
    { key: "location", header: t("sections.locations"), render: (row) => row.location },
    { key: "available", header: t("table.available"), render: (row) => row.available },
    { key: "reserved", header: t("table.reserved"), render: (row) => row.reserved },
    { key: "transit", header: t("table.transit"), render: (row) => row.inTransit },
    { key: "slow", header: t("table.slow"), render: (row) => row.slowMoving },
  ];
  const salesColumns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "units", header: t("table.units"), render: (row) => row.unitsSold },
    { key: "revenue", header: t("table.revenue"), render: (row) => `$${row.revenue.toLocaleString()}` },
    { key: "margin", header: t("table.margin"), render: (row) => row.margin },
  ];
  const logisticsColumns: DataTableColumn<LogisticsStatus>[] = [
    { key: "shipment", header: t("table.shipment"), render: (row) => row.shipment },
    { key: "po", header: t("table.po"), render: (row) => row.poNo },
    { key: "status", header: t("table.status"), render: (row) => row.status },
    { key: "eta", header: t("table.eta"), render: (row) => row.eta },
    { key: "units", header: t("table.units"), render: (row) => row.units },
  ];

  return (
    <>
      <PageHeader title={t("pages.dashboard.title")} description={t("pages.dashboard.description")} meta={t("app.mockDataPhase")} />
      <FilterBar />
      <section className={styles.metricGrid}>
        {metrics.map((metric) => (
          <DashboardCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className={styles.sectionGrid}>
        <SectionCard title={t("sections.inventoryStatusSummary")} eyebrow={t("sections.stockHealth")}>
          <div className={styles.summaryList}>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.readyStock")}</span><span className={styles.summaryValue}>74%</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.reservedStock")}</span><span className={styles.summaryValue}>96 {t("summary.units")}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.serviceHold")}</span><span className={styles.summaryValue}>24 {t("summary.units")}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>{t("summary.averageCoverage")}</span><span className={styles.summaryValue}>3.7 {t("summary.months")}</span></div>
          </div>
        </SectionCard>
        <SectionCard title={t("sections.topSellingModels")} eyebrow={t("sections.sales")}>
          <DataTable columns={salesColumns} rows={salesPerformance} />
        </SectionCard>
        <SectionCard title={t("sections.slowStockList")} eyebrow={t("sections.inventoryMovement")}>
          <DataTable columns={inventoryColumns} rows={inventoryItems.filter((item) => item.movementVelocity !== "fast")} />
        </SectionCard>
        <SectionCard title={t("sections.recentAlerts")} eyebrow={t("sections.autoAlerts")}>
          <DataTable columns={alertColumns} rows={alerts} />
        </SectionCard>
        <SectionCard title={t("sections.stockByLocation")} eyebrow={t("sections.multiLocation")}>
          <DataTable columns={locationColumns} rows={locationStocks} />
        </SectionCard>
        <SectionCard title={t("sections.logisticsStatusSnapshot")} eyebrow={t("sections.inbound")}>
          <DataTable columns={logisticsColumns} rows={logisticsStatuses} />
        </SectionCard>
      </section>
    </>
  );
}
