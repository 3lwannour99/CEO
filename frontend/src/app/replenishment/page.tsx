"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DonutChartCard } from "@/components/charts/DonutChartCard/DonutChartCard";
import { StackedBarChartCard } from "@/components/charts/StackedBarChartCard/StackedBarChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { exportCsv, exportExcel } from "@/lib/exportData";
import { formatNumber, formatValue } from "@/lib/apiClient";
import {
  groupReplenishmentUrgency,
  stockVsReorder,
  suggestedOrdersByModel,
} from "@/lib/chartMetrics";
import { useI18n } from "@/i18n/useI18n";
import type { ReplenishmentSuggestion } from "@/types/inventory";

export default function ReplenishmentPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const rows = useMemo(() => inventoryData.getReplenishment(filters), [filters, inventoryData]);
  const modelOnlyRows = useMemo(
    () => inventoryData.getReplenishment(filters, "modelOnly"),
    [filters, inventoryData],
  );
  const filteredItems = useMemo(
    () => inventoryData.getFilteredData(filters),
    [filters, inventoryData],
  );
  const suggestedOrdersChart = useMemo(
    () => suggestedOrdersByModel(modelOnlyRows, 10),
    [modelOnlyRows],
  );
  const urgencyChart = useMemo(() => groupReplenishmentUrgency(modelOnlyRows), [modelOnlyRows]);
  const stockVsReorderChart = useMemo(() => stockVsReorder(modelOnlyRows, 10), [modelOnlyRows]);
  const belowReorderCount = useMemo(
    () => modelOnlyRows.filter((row) => row.currentStock < row.reorderPoint).length,
    [modelOnlyRows],
  );
  const columns: DataTableColumn<ReplenishmentSuggestion>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "type", header: t("table.type"), render: (row) => row.type ?? "" },
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    {
      key: "current",
      header: t("table.currentStock"),
      render: (row) => formatNumber(row.currentStock),
    },
    {
      key: "sold30",
      header: t("table.soldLast30Days"),
      render: (row) => formatNumber(row.soldLast30Days),
    },
    {
      key: "sold90",
      header: t("table.soldLast90Days"),
      render: (row) => formatNumber(row.soldLast90Days),
    },
    {
      key: "totalDemand",
      header: t("transaction.totalSales"),
      render: (row) => formatNumber(row.totalSalesDemand ?? row.soldLast90Days),
    },
    {
      key: "internalDemand",
      header: t("transaction.internalSales"),
      render: (row) => formatNumber(row.internalSalesCount ?? 0),
    },
    {
      key: "avg",
      header: t("table.averageMonthlySales"),
      render: (row) => formatNumber(row.averageMonthlySales),
    },
    { key: "min", header: t("table.minStock"), render: (row) => formatNumber(row.minStock) },
    { key: "max", header: t("table.maxStock"), render: (row) => formatNumber(row.maxStock) },
    {
      key: "reorderPoint",
      header: t("table.reorderPoint"),
      render: (row) => formatNumber(row.reorderPoint),
    },
    {
      key: "leadTimeDays",
      header: t("table.leadTimeDays"),
      render: (row) => formatNumber(row.leadTimeDays),
    },
    {
      key: "suggested",
      header: t("table.suggestedOrderQuantity"),
      render: (row) => formatNumber(row.suggestedOrderQuantity),
    },
    { key: "urgency", header: t("table.urgency"), render: (row) => row.urgency },
    { key: "reason", header: t("table.suggestedAction"), render: (row) => row.reason },
  ];

  return (
    <>
      <PageHeader
        title={t("pages.replenishment.title")}
        description={t("pages.replenishment.description")}
      />
      <FilterBar
        filters={filters}
        inventoryItems={inventoryData.inventoryItems}
        sources={inventoryData.sources}
        onChange={setFilters}
      />
      <section className="report-actions" aria-label={t("transaction.replenishmentRealSalesNote")}>
        <span>{t("transaction.replenishmentRealSalesNote")}</span>
      </section>
      <div className="report-actions">
        <button
          className="report-button primary"
          type="button"
          onClick={() => exportExcel("replenishment.xls", rows)}
        >
          {t("actions.exportExcel")}
        </button>
        <button
          className="report-button"
          type="button"
          onClick={() => exportCsv("replenishment.csv", rows)}
        >
          {t("actions.exportCsv")}
        </button>
      </div>
      <ChartGrid>
        <BarChartCard
          title={t("charts.suggestedOrdersByModel")}
          subtitle={t("charts.top10")}
          insight={`${formatNumber(suggestedOrdersChart[0]?.value ?? 0)} ${suggestedOrdersChart[0]?.name ?? ""}`}
          data={suggestedOrdersChart}
          isLoading={inventoryData.isInitialLoading}
        />
        <DonutChartCard
          title={t("charts.replenishmentUrgency")}
          subtitle={t("charts.liveFilteredData")}
          insight={`${formatNumber(modelOnlyRows.filter((row) => row.urgency === "critical" || row.urgency === "high").length)} ${t("table.urgency")}`}
          data={urgencyChart}
          isLoading={inventoryData.isInitialLoading}
        />
      </ChartGrid>
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
        title={t("sections.replenishmentSuggestions")}
        eyebrow={t("sections.planning")}
        action={formatNumber(rows.length)}
      >
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={inventoryData.isInitialLoading}
          emptyMessage={t("filters.emptyFiltered")}
        />
      </SectionCard>
      <SectionCard
        title={t("replenishment.byModelOnly")}
        eyebrow={t("sections.planning")}
        action={formatNumber(modelOnlyRows.length)}
      >
        <DataTable
          columns={columns.filter((column) => column.key !== "color")}
          rows={modelOnlyRows}
          isLoading={inventoryData.isInitialLoading}
          emptyMessage={t("filters.emptyFiltered")}
        />
      </SectionCard>
    </>
  );
}
