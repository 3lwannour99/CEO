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
import { formatDate, formatNumber, formatValue } from "@/lib/apiClient";
import { formatMoneyBundle } from "@/lib/currency";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type { InventoryItem } from "@/types/inventory";
import type { InventoryMovementMatrixItem } from "@/types/inventory";
import styles from "@/app/dashboard/dashboard.module.css";

export default function InventoryMovementPage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const currentStock = useMemo(() => rows.filter((row) => row.isInStock), [rows]);
  const matrixRows = useMemo(() => inventoryData.getInventoryMovementMatrix(filters), [filters, inventoryData]);
  const categoryCounts = useMemo(() => {
    const counts = { fast: 0, medium: 0, slow: 0, unknown: 0 };
    currentStock.forEach((item) => {
      const category = item.stockAgeDays === null || item.stockAgeDays === undefined ? "unknown" : item.stockAgeDays > 90 ? "slow" : item.stockAgeDays >= 30 ? "medium" : "fast";
      counts[category] += item.quantity || 1;
    });
    return counts;
  }, [currentStock]);
  const percent = (value: number) => (currentStock.length > 0 ? `${formatNumber(Math.round((value / currentStock.reduce((sum, item) => sum + (item.quantity || 1), 0)) * 100))}%` : "0%");
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "chassis", header: t("table.chassis"), render: (row) => formatValue(row.chassis) },
    { key: "model", header: t("table.model"), render: (row) => `${row.brand} ${row.model}` },
    { key: "source", header: t("table.source"), render: (row) => row.sourceName },
    { key: "branch", header: t("table.branch"), render: (row) => formatValue(row.branch) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "status", header: t("table.status"), render: (row) => <StatusBadge tone={row.normalizedStatus || "unknown"} /> },
    { key: "age", header: t("table.stockAgeDays"), render: (row) => formatValue(row.stockAgeDays) },
    { key: "movement", header: t("table.movementCategory"), render: (row) => <StatusBadge tone={row.movementCategory} /> },
    { key: "grpo", header: t("table.grpoDate"), render: (row) => formatDate(row.grpoDate) },
    { key: "price1", header: t("table.price1"), render: (row) => formatMoneyBundle(row.price1, row, language, selectedCurrencies) },
    { key: "soldPrice", header: t("table.soldPrice"), render: (row) => formatMoneyBundle(row.soldPrice, row, language, selectedCurrencies) },
    { key: "vat", header: t("table.vat"), render: (row) => formatMoneyBundle(row.vat, row, language, selectedCurrencies) },
    { key: "qty", header: t("table.qty"), render: (row) => formatNumber(row.quantity) },
  ];
  const matrixColumns: DataTableColumn<InventoryMovementMatrixItem>[] = [
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "type", header: t("table.type"), render: (row) => formatValue(row.type) },
    { key: "fast", header: t("inventoryMovement.fastCount"), render: (row) => formatNumber(row.fastCount) },
    { key: "medium", header: t("inventoryMovement.mediumCount"), render: (row) => formatNumber(row.mediumCount) },
    { key: "slow", header: t("inventoryMovement.slowCount"), render: (row) => formatNumber(row.slowCount) },
    { key: "unknown", header: t("inventoryMovement.unknownCount"), render: (row) => formatNumber(row.unknownCount) },
    { key: "total", header: t("table.total"), render: (row) => formatNumber(row.totalCount) },
    { key: "slowPercentage", header: t("inventoryMovement.slowPercentage"), render: (row) => `${formatNumber(row.slowPercentage)}%` },
    { key: "averageDays", header: t("inventoryMovement.averageDaysInStock"), render: (row) => formatValue(row.averageDaysInStock) },
  ];

  return (
    <>
      <PageHeader title={t("pages.inventoryMovement.title")} description={t("pages.inventoryMovement.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("inventory-movement.xls", rows)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("inventory-movement.csv", rows)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("inventory-movement.pdf", rows)}>{t("actions.exportPdf")}</button>
      </div>
      <MetaStrip meta={inventoryData.meta} />
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && rows.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("inventoryMovement.categoryCards")} eyebrow={t("sections.inventoryMovement")}>
        <section className={styles.metricGrid}>
          <DashboardCard label={t("table.total")} value={formatNumber(currentStock.reduce((sum, item) => sum + (item.quantity || 1), 0))} trend={t("table.currentStock")} />
          <DashboardCard label={t("status.fast")} value={formatNumber(categoryCounts.fast)} trend={percent(categoryCounts.fast)} tone="positive" />
          <DashboardCard label={t("status.medium")} value={formatNumber(categoryCounts.medium)} trend={percent(categoryCounts.medium)} />
          <DashboardCard label={t("status.slow")} value={formatNumber(categoryCounts.slow)} trend={percent(categoryCounts.slow)} tone="warning" />
          <DashboardCard label={t("status.unknown")} value={formatNumber(categoryCounts.unknown)} trend={percent(categoryCounts.unknown)} tone="neutral" />
        </section>
      </SectionCard>
      <SectionCard title={t("inventoryMovement.modelCategoryMatrix")} eyebrow={t("sections.inventoryMovement")} action={formatNumber(matrixRows.length)}>
        <DataTable columns={matrixColumns} rows={matrixRows} maxVisibleRows={15} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.movementRegister")} eyebrow={t("summary.liveData")} action={formatNumber(rows.length)}>
        <DataTable columns={columns} rows={rows} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



