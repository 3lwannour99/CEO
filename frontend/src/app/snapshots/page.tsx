"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { LineChartCard } from "@/components/charts/LineChartCard/LineChartCard";
import { StackedBarChartCard } from "@/components/charts/StackedBarChartCard/StackedBarChartCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useInventoryData } from "@/hooks/useInventoryData";
import { formatDate, formatNumber } from "@/lib/apiClient";
import { groupSnapshotMonthlyComparison } from "@/lib/chartMetrics";
import { exportCsv, exportExcel } from "@/lib/exportData";
import { getMonthlyComparison, getSnapshot, getSnapshots, runSnapshot } from "@/services/inventoryApi";
import { useI18n } from "@/i18n/useI18n";
import type { InventorySnapshot, InventorySnapshotDetail, MonthlyComparison, SnapshotBreakdownRow, SnapshotFilters } from "@/types/inventory";

const emptyFilters: SnapshotFilters = {};

export default function SnapshotsPage() {
  const { t } = useI18n();
  const inventoryData = useInventoryData();
  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<InventorySnapshotDetail | null>(null);
  const [monthly, setMonthly] = useState<MonthlyComparison[]>([]);
  const [draftFilters, setDraftFilters] = useState<SnapshotFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<SnapshotFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async (filters: SnapshotFilters = appliedFilters, selectedId = selectedSnapshot?.id) => {
    setLoading(true);
    try {
      const [snapshotRows, monthlyRows] = await Promise.all([getSnapshots(filters), getMonthlyComparison(filters)]);
      setSnapshots(snapshotRows);
      setMonthly(monthlyRows);
      const nextSelectedId = selectedId ?? snapshotRows[0]?.id;
      setSelectedSnapshot(nextSelectedId ? await getSnapshot(nextSelectedId, filters) : null);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, selectedSnapshot?.id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load(emptyFilters, undefined);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  function applyFilters(nextFilters = draftFilters) {
    const cleaned = cleanFilters(nextFilters);
    setAppliedFilters(cleaned);
    void load(cleaned, selectedSnapshot?.id);
  }

  async function runNow(filtered: boolean) {
    setRunning(true);
    try {
      await runSnapshot({ filtered, filters: filtered ? appliedFilters : {} });
      await load(appliedFilters);
    } finally {
      setRunning(false);
    }
  }

  const options = useMemo(() => ({
    brands: unique(inventoryData.inventoryItems.map((item) => item.brand)),
    models: unique(inventoryData.inventoryItems.map((item) => item.model)),
    types: unique(inventoryData.inventoryItems.map((item) => item.type)),
    colors: unique(inventoryData.inventoryItems.map((item) => item.exteriorColor)),
    warehouses: unique(inventoryData.inventoryItems.map((item) => item.warehouse)),
    branches: unique(inventoryData.inventoryItems.map((item) => item.branch)),
  }), [inventoryData.inventoryItems]);
  const monthlyChart = useMemo(() => groupSnapshotMonthlyComparison(monthly), [monthly]);
  const selectedBreakdownChart = useMemo(() => (selectedSnapshot?.breakdowns.bySource ?? []).slice(0, 10).map((row) => ({ name: row.label, value: row.units })), [selectedSnapshot]);

  const snapshotColumns: DataTableColumn<InventorySnapshot>[] = [
    { key: "date", header: t("table.snapshotDate"), render: (row) => formatDate(row.snapshotDate) },
    { key: "source", header: t("table.source"), render: (row) => row.scopeLabel || row.sourceName || "-" },
    { key: "total", header: t("table.totalUnits"), render: (row) => formatNumber(row.totalUnits) },
    { key: "stock", header: t("table.currentStock"), render: (row) => formatNumber(row.inStockUnits) },
    { key: "sold", header: t("table.soldUnits"), render: (row) => formatNumber(row.soldUnits) },
    { key: "reserved", header: t("table.reservedUnits"), render: (row) => formatNumber(row.reservedUnits) },
    { key: "slow", header: t("table.slow"), render: (row) => formatNumber(row.slowUnits) },
    { key: "medium", header: t("status.medium"), render: (row) => formatNumber(row.mediumUnits) },
    { key: "fast", header: t("status.fast"), render: (row) => formatNumber(row.fastUnits) },
    { key: "sar", header: "SAR", render: (row) => formatNumber(row.totalValueSar) },
    { key: "jod", header: "JOD", render: (row) => formatNumber(row.totalValueJod) },
    { key: "usd", header: "USD", render: (row) => formatNumber(row.totalValueUsd) },
    { key: "created", header: t("table.created"), render: (row) => formatDate(row.createdAt) },
    {
      key: "details",
      header: t("common.actions"),
      render: (row) => (
        <button className="report-button" type="button" onClick={() => void selectSnapshot(row.id)}>
          {t("snapshots.viewDetails")}
        </button>
      ),
    },
  ];
  const monthlyColumns: DataTableColumn<MonthlyComparison>[] = [
    { key: "period", header: t("table.month"), render: (row) => row.periodLabel ?? row.month },
    { key: "total", header: t("table.totalUnits"), render: (row) => formatChange(row.totalUnits, row.totalUnitsChange) },
    { key: "stock", header: t("table.currentStock"), render: (row) => formatChange(row.inStockUnits, row.inStockUnitsChange) },
    { key: "sold", header: t("table.soldUnits"), render: (row) => formatChange(row.soldUnits, row.soldUnitsChange) },
    { key: "reserved", header: t("table.reservedUnits"), render: (row) => formatChange(row.reservedUnits, row.reservedUnitsChange) },
    { key: "slow", header: t("status.slow"), render: (row) => formatChange(row.slowUnits, row.slowUnitsChange) },
    { key: "sar", header: "SAR", render: (row) => formatChange(row.stockValueSar, row.stockValueSarChange) },
    { key: "jod", header: "JOD", render: (row) => formatChange(row.stockValueJod, row.stockValueJodChange) },
    { key: "usd", header: "USD", render: (row) => formatChange(row.stockValueUsd, row.stockValueUsdChange) },
  ];
  const breakdownColumns: DataTableColumn<SnapshotBreakdownRow>[] = [
    { key: "label", header: t("common.name"), render: (row) => row.label },
    { key: "units", header: t("table.units"), render: (row) => formatNumber(row.units) },
    { key: "stock", header: t("table.currentStock"), render: (row) => formatNumber(row.inStockUnits) },
    { key: "sold", header: t("table.soldUnits"), render: (row) => formatNumber(row.soldUnits) },
    { key: "reserved", header: t("table.reservedUnits"), render: (row) => formatNumber(row.reservedUnits) },
    { key: "slow", header: t("status.slow"), render: (row) => formatNumber(row.slowUnits) },
    { key: "medium", header: t("status.medium"), render: (row) => formatNumber(row.mediumUnits) },
    { key: "fast", header: t("status.fast"), render: (row) => formatNumber(row.fastUnits) },
    { key: "sar", header: "SAR", render: (row) => formatNumber(row.stockValueSar) },
    { key: "jod", header: "JOD", render: (row) => formatNumber(row.stockValueJod) },
    { key: "usd", header: "USD", render: (row) => formatNumber(row.stockValueUsd) },
    { key: "percent", header: "%", render: (row) => `${formatNumber(row.percentageOfTotal)}%` },
  ];

  async function selectSnapshot(id: string) {
    setSelectedSnapshot(await getSnapshot(id, appliedFilters));
  }

  return (
    <>
      <PageHeader title={t("pages.snapshots.title")} description={t("pages.snapshots.description")} />
      <SectionCard title={t("snapshots.filtersTitle")} eyebrow={dateRangeSummary(appliedFilters)}>
        <div className="filter-grid">
          <input className="filter-input" type="date" value={draftFilters.fromDate ?? ""} onChange={(event) => setDraftFilters({ ...draftFilters, fromDate: event.target.value })} />
          <input className="filter-input" type="date" value={draftFilters.toDate ?? ""} onChange={(event) => setDraftFilters({ ...draftFilters, toDate: event.target.value })} />
          <select className="filter-input" value="" onChange={(event) => setDraftFilters({ ...draftFilters, ...presetRange(event.target.value) })}>
            <option value="">{t("snapshots.filtersTitle")}</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
          <select className="filter-input" value={draftFilters.sourceId ?? ""} onChange={(event) => setDraftFilters({ ...draftFilters, sourceId: event.target.value })}>
            <option value="">{t("table.source")}</option>
            {inventoryData.sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
          <FilterSelect label={t("table.brand")} value={draftFilters.brand} options={options.brands} onChange={(brand) => setDraftFilters({ ...draftFilters, brand })} />
          <FilterSelect label={t("table.model")} value={draftFilters.model} options={options.models} onChange={(model) => setDraftFilters({ ...draftFilters, model })} />
          <FilterSelect label={t("table.type")} value={draftFilters.type} options={options.types} onChange={(type) => setDraftFilters({ ...draftFilters, type })} />
          <FilterSelect label={t("table.color")} value={draftFilters.exteriorColor} options={options.colors} onChange={(exteriorColor) => setDraftFilters({ ...draftFilters, exteriorColor })} />
          <FilterSelect label={t("table.warehouse")} value={draftFilters.warehouse} options={options.warehouses} onChange={(warehouse) => setDraftFilters({ ...draftFilters, warehouse })} />
          <FilterSelect label={t("table.branch")} value={draftFilters.branch} options={options.branches} onChange={(branch) => setDraftFilters({ ...draftFilters, branch })} />
        </div>
        <div className="report-actions">
          <button className="report-button primary" type="button" onClick={() => applyFilters()}>{t("common.search")}</button>
          <button className="report-button" type="button" onClick={() => { setDraftFilters(emptyFilters); applyFilters(emptyFilters); }}>{t("roles.clearAll")}</button>
        </div>
      </SectionCard>
      <div className="report-actions">
        <button className="report-button primary" type="button" disabled={running} onClick={() => void runNow(false)}>{running ? t("filters.loadingData") : t("snapshots.runFullSnapshot")}</button>
        <button className="report-button" type="button" disabled={running || Object.keys(appliedFilters).length === 0} onClick={() => void runNow(true)}>{t("snapshots.runFilteredSnapshot")}</button>
        <span>{t("snapshots.runSnapshotDescription")}</span>
        <button className="report-button" type="button" onClick={() => exportExcel("snapshots.xls", snapshots)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("snapshots.csv", snapshots)}>{t("actions.exportCsv")}</button>
      </div>
      <ChartGrid>
        <LineChartCard title={t("charts.monthlyStockTrend")} subtitle={dateRangeSummary(appliedFilters)} insight={`${formatNumber(monthly.at(-1)?.totalUnits ?? 0)} ${t("table.totalUnits")}`} data={monthlyChart} keys={["stock", "sold", "reserved"]} isLoading={loading} />
        <StackedBarChartCard title={t("charts.movementCategory")} subtitle={t("charts.monthlyStockTrend")} insight={t("charts.liveFilteredData")} data={monthlyChart} keys={["fast", "medium", "slow"]} isLoading={loading} />
        <LineChartCard title={t("charts.stockValueTrend")} subtitle="SAR / JOD / USD" insight={`${formatNumber(monthly.at(-1)?.stockValueUsd ?? 0)} USD`} data={monthlyChart} keys={["SAR", "JOD", "USD"]} isLoading={loading} />
        <BarChartCard title={t("snapshots.bySource")} subtitle={t("snapshots.snapshotDetails")} insight={`${selectedSnapshot?.scopeLabel ?? ""}`} data={selectedBreakdownChart} isLoading={loading} />
      </ChartGrid>
      <SectionCard title={t("sidebar.snapshots")} eyebrow={t("actions.dailySnapshot")}>
        <DataTable columns={snapshotColumns} rows={snapshots} isLoading={loading} emptyMessage={t("snapshots.noSnapshots")} />
      </SectionCard>
      <SectionCard title={t("actions.monthlyComparison")} eyebrow={dateRangeSummary(appliedFilters)}>
        <DataTable columns={monthlyColumns} rows={monthly} isLoading={loading} emptyMessage={snapshots.length > 0 ? t("snapshots.notEnoughHistoryForRange") : t("snapshots.noSnapshots")} />
      </SectionCard>
      {selectedSnapshot ? (
        <SectionCard title={t("snapshots.snapshotDetails")} eyebrow={selectedSnapshot.scopeLabel ?? (selectedSnapshot.isFiltered ? t("snapshots.filteredSnapshot") : t("snapshots.fullSnapshot"))}>
          {selectedSnapshot.filtersJson ? <p>{t("snapshots.filtersUsed")}: {JSON.stringify(selectedSnapshot.filtersJson)}</p> : null}
          {[
            ["bySource", t("snapshots.bySource")],
            ["byBrand", t("snapshots.byBrand")],
            ["byModel", t("snapshots.byModel")],
            ["byType", t("snapshots.byType")],
            ["byColor", t("snapshots.byColor")],
            ["byWarehouse", t("snapshots.byWarehouse")],
            ["byBranch", t("snapshots.byBranch")],
            ["byMovementCategory", t("snapshots.byMovementCategory")],
            ["byStatus", t("snapshots.byStatus")],
          ].map(([key, title]) => (
            <SectionCard key={key} title={title} eyebrow={t("snapshots.snapshotDetails")}>
              <DataTable columns={breakdownColumns} rows={selectedSnapshot.breakdowns[key as keyof typeof selectedSnapshot.breakdowns]} maxVisibleRows={15} emptyMessage={t("snapshots.noSnapshots")} />
            </SectionCard>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

function FilterSelect({ label, value, options, onChange }: Readonly<{ label: string; value?: string; options: string[]; onChange: (value: string) => void }>) {
  return (
    <select className="filter-input" value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function cleanFilters(filters: SnapshotFilters): SnapshotFilters {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))) as SnapshotFilters;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((left, right) => left.localeCompare(right));
}

function formatChange(value?: number, change?: number) {
  const formatted = formatNumber(value);
  if (typeof change !== "number") {
    return formatted;
  }
  return `${formatted} (${change >= 0 ? "+" : ""}${formatNumber(change)})`;
}

function dateRangeSummary(filters: SnapshotFilters) {
  if (!filters.fromDate && !filters.toDate) {
    return "";
  }
  return `${filters.fromDate ?? "..."} - ${filters.toDate ?? "..."}`;
}

function presetRange(preset: string): SnapshotFilters {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  } else if (preset === "last7") {
    start.setDate(today.getDate() - 6);
  } else if (preset === "last30") {
    start.setDate(today.getDate() - 29);
  } else if (preset === "thisMonth") {
    start.setDate(1);
  } else if (preset === "lastMonth") {
    start.setMonth(today.getMonth() - 1, 1);
    end.setDate(0);
  } else if (preset === "thisYear") {
    start.setMonth(0, 1);
  }
  return { fromDate: toDateInput(start), toDate: toDateInput(end) };
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
