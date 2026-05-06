"use client";

import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { locationStocks } from "@/lib/mockData";
import { useI18n } from "@/i18n/useI18n";
import type { LocationStock } from "@/types/inventory";

export default function MultiLocationPage() {
  const { t } = useI18n();
  const columns: DataTableColumn<LocationStock>[] = [
    { key: "location", header: t("sections.locations"), render: (row) => row.location },
    { key: "available", header: t("table.available"), render: (row) => row.available },
    { key: "reserved", header: t("table.reserved"), render: (row) => row.reserved },
    { key: "transit", header: t("table.inTransit"), render: (row) => row.inTransit },
    { key: "slow", header: t("table.slowMoving"), render: (row) => row.slowMoving },
    { key: "total", header: t("table.total"), render: (row) => row.available + row.reserved + row.inTransit },
  ];

  return (
    <>
      <PageHeader title={t("pages.multiLocation.title")} description={t("pages.multiLocation.description")} />
      <FilterBar />
      <SectionCard title={t("sections.branchStockMatrix")} eyebrow={t("sections.locations")}>
        <DataTable columns={columns} rows={locationStocks} />
      </SectionCard>
    </>
  );
}
