"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { useI18n } from "@/i18n/useI18n";
import { getMultiStatusChassis } from "@/services/inventoryApi";
import type { MultiStatusChassisGroup, MultiStatusChassisResponse } from "@/types/inventory";

export default function MultiStatusChassisPage() {
  const { t } = useI18n();
  const [data, setData] = useState<MultiStatusChassisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMultiStatusChassis()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load data");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const groupColumns: DataTableColumn<MultiStatusChassisGroup>[] = [
    { key: "company", header: t("table.columns.company"), render: (row) => row.sourceName },
    { key: "chassis", header: t("table.columns.chassis"), render: (row) => row.chassis },
    { key: "rowCount", header: t("table.rowCount") || "Row Count", render: (row) => row.rowCount.toString() },
    { key: "statuses", header: t("table.columns.status"), render: (row) => row.statuses.join(", ") },
  ];

  if (error) {
    return (
      <>
        <PageHeader title={t("sidebar.multiStatusChassis")} description="Chassis with multiple statuses" />
        <SectionCard title="Error">
          <p>{error}</p>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("sidebar.multiStatusChassis")} description="View chassis that have multiple distinct statuses across different records." />
      <SectionCard title="Summary">
        <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
          <div><strong>Total Groups:</strong> {data?.meta.totalGroups ?? "-"}</div>
          <div><strong>Total Rows:</strong> {data?.meta.totalRows ?? "-"}</div>
          <div><strong>Last Synced At:</strong> {data?.meta.lastSyncedAt ? new Date(data.meta.lastSyncedAt).toLocaleString() : "-"}</div>
        </div>
      </SectionCard>
      <SectionCard title="Multi-Status Chassis">
        <DataTable
          columns={groupColumns}
          rows={data?.data || []}
          isLoading={loading}
          emptyMessage="No multi-status chassis found."
        />
      </SectionCard>
    </>
  );
}
