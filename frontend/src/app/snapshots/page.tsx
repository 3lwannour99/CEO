"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { formatDate, formatNumber } from "@/lib/apiClient";
import { exportCsv, exportExcel } from "@/lib/exportData";
import { getMonthlyComparison, getSnapshots, runSnapshot } from "@/services/inventoryApi";
import { useI18n } from "@/i18n/useI18n";
import type { InventorySnapshot, MonthlyComparison } from "@/types/inventory";

export default function SnapshotsPage() {
  const { t } = useI18n();
  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
  const [monthly, setMonthly] = useState<MonthlyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [snapshotRows, monthlyRows] = await Promise.all([getSnapshots(), getMonthlyComparison()]);
      setSnapshots(snapshotRows);
      setMonthly(monthlyRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function runNow() {
    setRunning(true);
    try {
      await runSnapshot();
      await load();
    } finally {
      setRunning(false);
    }
  }

  const snapshotColumns: DataTableColumn<InventorySnapshot>[] = [
    { key: "date", header: t("table.snapshotDate"), render: (row) => formatDate(row.snapshotDate) },
    { key: "total", header: t("table.totalUnits"), render: (row) => formatNumber(row.totalUnits) },
    { key: "stock", header: t("table.currentStock"), render: (row) => formatNumber(row.inStockUnits) },
    { key: "sold", header: t("table.soldUnits"), render: (row) => formatNumber(row.soldUnits) },
    { key: "reserved", header: t("table.reservedUnits"), render: (row) => formatNumber(row.reservedUnits) },
    { key: "slow", header: t("table.slow"), render: (row) => formatNumber(row.slowUnits) },
  ];
  const monthlyColumns: DataTableColumn<MonthlyComparison>[] = [
    { key: "month", header: t("table.month"), render: (row) => row.month },
    { key: "total", header: t("table.totalUnits"), render: (row) => formatNumber(row.totalUnits) },
    { key: "fast", header: t("status.fast"), render: (row) => formatNumber(row.fastUnits) },
    { key: "medium", header: t("status.medium"), render: (row) => formatNumber(row.mediumUnits) },
    { key: "slow", header: t("status.slow"), render: (row) => formatNumber(row.slowUnits) },
    { key: "sold", header: t("table.soldUnits"), render: (row) => formatNumber(row.soldUnits) },
  ];

  return (
    <>
      <PageHeader title={t("pages.snapshots.title")} description={t("pages.snapshots.description")} />
      <div className="report-actions">
        <button className="report-button primary" type="button" disabled={running} onClick={() => void runNow()}>{running ? t("filters.loadingData") : t("actions.runSnapshot")}</button>
        <button className="report-button" type="button" onClick={() => exportExcel("snapshots.xls", snapshots)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("snapshots.csv", snapshots)}>{t("actions.exportCsv")}</button>
      </div>
      <SectionCard title={t("sidebar.snapshots")} eyebrow={t("actions.dailySnapshot")}>
        <DataTable columns={snapshotColumns} rows={snapshots} isLoading={loading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
      <SectionCard title={t("actions.monthlyComparison")} eyebrow={t("sidebar.snapshots")}>
        <DataTable columns={monthlyColumns} rows={monthly} isLoading={loading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}
