"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatNumber } from "@/lib/apiClient";
import { formatMoneyTotalsCompact } from "@/lib/currency";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exportData";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { useI18n } from "@/i18n/useI18n";
import type { SalesPerformanceItem } from "@/types/inventory";

export default function SalesPerformancePage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const data = useMemo(() => inventoryData.getSalesPerformance(filters), [filters, inventoryData]);
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const columns: DataTableColumn<SalesPerformanceItem>[] = [
    { key: "brand", header: t("table.brand"), render: (row) => row.brand },
    { key: "model", header: t("table.model"), render: (row) => row.model },
    { key: "type", header: t("table.type"), render: (row) => row.type ?? "" },
    { key: "units", header: t("table.unitsSold"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies) },
  ];
  const colorColumns: DataTableColumn<SalesPerformanceItem>[] = [
    ...columns.slice(0, 3),
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor ?? "" },
    ...columns.slice(3),
    { key: "averagePrice", header: t("currency.averagePrice"), render: (row) => row.averageSoldPrice ? formatMoneyTotalsCompact(row.averageSoldPrice, language, selectedCurrencies) : "-" },
    { key: "customerGroups", header: t("salesmenKpi.topCustomerGroups"), render: (row) => row.customerGroupBreakdown?.map((item) => `${item.customerGroup} (${formatNumber(item.unitsSold)})`).join(", ") ?? "-" },
    { key: "branch", header: t("table.branch"), render: (row) => row.branch ?? "-" },
    { key: "source", header: t("table.source"), render: (row) => row.sourceName ?? "-" },
    { key: "sellThrough", header: t("table.sellThroughRate"), render: (row) => `${formatNumber(row.sellThroughRate)}%` },
    { key: "turnover", header: t("table.inventoryTurnover"), render: (row) => formatNumber(row.inventoryTurnover) },
  ];
  const sellingColorColumns: DataTableColumn<{ exteriorColor: string; unitsSold: number; revenue: SalesPerformanceItem["revenue"] }>[] = [
    { key: "color", header: t("table.color"), render: (row) => row.exteriorColor },
    { key: "units", header: t("table.unitsSold"), render: (row) => formatNumber(row.unitsSold) },
    { key: "revenue", header: t("table.revenue"), render: (row) => formatMoneyTotalsCompact(row.revenue, language, selectedCurrencies) },
  ];

  return (
    <>
      <PageHeader title={t("pages.salesPerformance.title")} description={t("pages.salesPerformance.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("sales-performance.xls", data.breakdownByModel)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("sales-performance.csv", data.breakdownByModel)}>{t("actions.exportCsv")}</button>
        <button className="report-button" type="button" onClick={() => exportPdf("sales-performance.pdf", data.breakdownByModel)}>{t("actions.exportPdf")}</button>
      </div>
      <section className="report-actions" aria-label={t("sections.sales")}>
        <span>{t("table.sellThroughRate")}: {formatNumber(data.sellThroughRate)}%</span>
        <span>{t("table.inventoryTurnover")}: {formatNumber(data.inventoryTurnover)}</span>
        <span>{t("table.averageMovement")}: {formatNumber(data.averageMovement)}</span>
      </section>
      <ApiState loading={inventoryData.isInitialLoading} refreshing={inventoryData.isRefreshing} error={inventoryData.error} partial={(inventoryData.meta?.failedSources ?? 0) > 0} empty={!inventoryData.isInitialLoading && filteredItems.length === 0} onRetry={() => void inventoryData.refreshData()} onReset={resetFilters} />
      <SectionCard title={t("sections.salesPerformanceTable")} eyebrow={t("sections.commercial")} action={t("sections.topSellingModels")}>
        <DataTable columns={columns} rows={data.topSellingModels} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("sections.bottomSellingModels")} eyebrow={t("sections.commercial")}>
        <DataTable columns={columns} rows={data.lowestSellingModels} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.byModelAndColor")} eyebrow={t("sections.commercial")} action={formatNumber(data.breakdownByModelColor?.length ?? 0)}>
        <DataTable columns={colorColumns} rows={data.breakdownByModelColor ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.bestSellingColors")} eyebrow={t("sections.commercial")}>
        <DataTable columns={sellingColorColumns} rows={data.bestSellingColors ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("salesPerformance.lowestSellingColors")} eyebrow={t("sections.commercial")}>
        <DataTable columns={sellingColorColumns} rows={data.lowestSellingColors ?? []} isLoading={inventoryData.isInitialLoading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}



