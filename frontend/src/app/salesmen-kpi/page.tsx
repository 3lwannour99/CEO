"use client";

import { useMemo } from "react";
import { ApiState } from "@/components/ApiState/ApiState";
import { BarChartCard } from "@/components/charts/BarChartCard/BarChartCard";
import { ChartGrid } from "@/components/charts/ChartGrid/ChartGrid";
import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { FilterBar } from "@/components/FilterBar/FilterBar";
import { MetaStrip } from "@/components/MetaStrip/MetaStrip";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import { formatDate, formatNumber } from "@/lib/apiClient";
import { formatMoneyTotalsBreakdown, formatMoneyTotalsCompact } from "@/lib/currency";
import { exportCsv, exportExcel } from "@/lib/exportData";
import { calculateSalesmenKpi, type CountBreakdown, type SalesmanKpi } from "@/lib/reports/salesmenKpi";
import { useCurrencyDisplay } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import styles from "./page.module.css";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function BreakdownCell({ items }: { items: CountBreakdown[] }) {
  const { language } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  return (
    <div className={styles.listCell}>
      {items.length === 0
        ? "-"
        : items.map((item) => (
            <span className={styles.pill} key={item.label}>
              {item.label} ({formatNumber(item.count)})
              {item.salesmenCount ? ` · ${formatNumber(item.salesmenCount)}` : ""}
              {item.revenueOpportunity ? ` · ${formatMoneyTotalsCompact(item.revenueOpportunity, language, selectedCurrencies)}` : ""}
            </span>
          ))}
    </div>
  );
}

function NamesOnlyCell({ items }: { items: CountBreakdown[] }) {
  return (
    <div className={styles.listCell}>
      {items.length === 0
        ? "-"
        : items.map((item) => (
            <span className={styles.pill} key={item.label}>
              {item.label}
            </span>
          ))}
    </div>
  );
}

export default function SalesmenKpiPage() {
  const { language, t } = useI18n();
  const { selectedCurrencies } = useCurrencyDisplay();
  const locale = language;
  const currencyLabels = { original: t("currency.original"), sar: t("currency.sar"), jod: t("currency.jod"), usd: t("currency.usd") };
  const inventoryData = useInventoryData();
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const filteredItems = useMemo(() => inventoryData.getFilteredData(filters), [filters, inventoryData]);
  const report = useMemo(() => calculateSalesmenKpi(filteredItems), [filteredItems]);
  const salesBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.externalSoldUnits })).slice(0, 10), [report.salesmen]);
  const reservationsBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.externalReservedUnits })).slice(0, 10), [report.salesmen]);
  const revenueBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.externalRevenue.usd })).slice(0, 10), [report.salesmen]);
  const reservationValueBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.externalReservationValue.usd })).slice(0, 10), [report.salesmen]);
  const averagePriceBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.averageSoldPrice.usd })).slice(0, 10), [report.salesmen]);
  const modelCoverageBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.topSoldModels.length })).slice(0, 10), [report.salesmen]);
  const reservationModelCoverageBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.topReservedModels.length })).slice(0, 10), [report.salesmen]);
  const missedBySalesman = useMemo(() => report.salesmen.map((row) => ({ name: row.salesman, value: row.missingModels.length })).slice(0, 10), [report.salesmen]);
  const reservationStatusMix = useMemo(
    () => [
      { name: t("status.reserve"), value: report.reserveUnits },
      { name: t("status.contract"), value: report.contractUnits },
      { name: t("status.cession"), value: report.cessionUnits },
      { name: t("status.reservationForCompanies"), value: report.companyReservationUnits },
    ],
    [report, t],
  );

  const rankingColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "externalSoldUnits", header: t("transaction.externalSales"), render: (row) => formatNumber(row.externalSoldUnits) },
    { key: "internalSoldUnits", header: t("transaction.internalSales"), render: (row) => formatNumber(row.internalSoldUnits) },
    { key: "soldUnits", header: t("transaction.totalSales"), render: (row) => formatNumber(row.soldUnits) },
    { key: "externalRevenue", header: t("transaction.externalRevenue"), render: (row) => formatMoneyTotalsCompact(row.externalRevenue, locale, selectedCurrencies) },
    { key: "internalRevenue", header: t("transaction.internalRevenue"), render: (row) => formatMoneyTotalsCompact(row.internalRevenue, locale, selectedCurrencies) },
    { key: "revenue", header: t("transaction.totalRevenue"), render: (row) => formatMoneyTotalsCompact(row.soldRevenue, locale, selectedCurrencies) },
    { key: "average", header: t("salesmenKpi.averageSoldPrice"), render: (row) => formatMoneyTotalsCompact(row.averageSoldPrice, locale, selectedCurrencies) },
    { key: "shareExternalSales", header: t("salesmenKpi.shareOfSales"), render: (row) => formatPercent(row.shareOfExternalSales) },
    { key: "shareSales", header: t("transaction.totalSales"), render: (row) => formatPercent(row.shareOfTotalSales) },
    { key: "shareRevenue", header: t("salesmenKpi.shareOfRevenue"), render: (row) => formatPercent(row.shareOfTotalRevenue) },
    { key: "lastSale", header: t("salesmenKpi.lastSaleDate"), render: (row) => formatDate(row.lastSaleDate) },
  ];

  const detailsColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "retail", header: t("salesmenKpi.retailSales"), render: (row) => formatNumber(row.retailSalesCount) },
    { key: "brokers", header: t("salesmenKpi.brokersSales"), render: (row) => formatNumber(row.brokersSalesCount) },
    { key: "fleet", header: t("salesmenKpi.fleetSales"), render: (row) => formatNumber(row.fleetSalesCount) },
    { key: "bank", header: t("salesmenKpi.bankSales"), render: (row) => formatNumber(row.bankSalesCount) },
    { key: "firstSale", header: t("salesmenKpi.firstSaleDate"), render: (row) => formatDate(row.firstSaleDate) },
    { key: "days", header: t("salesmenKpi.averageDaysToSell"), render: (row) => formatNumber(row.averageDaysToSell) },
  ];

  const reservationRankingColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "externalReservedUnits", header: t("transaction.externalReservations"), render: (row) => formatNumber(row.externalReservedUnits) },
    { key: "internalReservedUnits", header: t("transaction.internalReservations"), render: (row) => formatNumber(row.internalReservedUnits) },
    { key: "reservedUnits", header: t("transaction.totalReservations"), render: (row) => formatNumber(row.reservedUnits) },
    { key: "externalReservationValue", header: t("salesmenKpi.externalReservationValue"), render: (row) => formatMoneyTotalsCompact(row.externalReservationValue, locale, selectedCurrencies) },
    { key: "internalReservationValue", header: t("salesmenKpi.internalReservationValue"), render: (row) => formatMoneyTotalsCompact(row.internalReservationValue, locale, selectedCurrencies) },
    { key: "reservationValue", header: t("salesmenKpi.totalReservationValue"), render: (row) => formatMoneyTotalsCompact(row.reservationValue, locale, selectedCurrencies) },
    { key: "averageReservationValue", header: t("salesmenKpi.averageReservationValue"), render: (row) => formatMoneyTotalsCompact(row.averageReservationValue, locale, selectedCurrencies) },
    { key: "shareExternalReservations", header: t("salesmenKpi.shareOfReservations"), render: (row) => formatPercent(row.shareOfExternalReservations) },
    { key: "shareReservations", header: t("transaction.totalReservations"), render: (row) => formatPercent(row.shareOfTotalReservations) },
    { key: "shareReservationValue", header: t("salesmenKpi.shareOfReservationValue"), render: (row) => formatPercent(row.shareOfTotalReservationValue) },
    { key: "lastReservation", header: t("salesmenKpi.lastReservationDate"), render: (row) => formatDate(row.lastReservationDate) },
  ];

  const reservationStatusColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "reserve", header: t("status.reserve"), render: (row) => formatNumber(row.reserveCount) },
    { key: "contract", header: t("status.contract"), render: (row) => formatNumber(row.contractCount) },
    { key: "cession", header: t("status.cession"), render: (row) => formatNumber(row.cessionCount) },
    { key: "companyReservation", header: t("status.reservationForCompanies"), render: (row) => formatNumber(row.companyReservationCount) },
    { key: "firstReservation", header: t("salesmenKpi.firstReservationDate"), render: (row) => formatDate(row.firstReservationDate) },
    { key: "lastReservation", header: t("salesmenKpi.lastReservationDate"), render: (row) => formatDate(row.lastReservationDate) },
  ];

  const breakdownColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "models", header: t("salesmenKpi.topModels"), render: (row) => <BreakdownCell items={row.topSoldModels} /> },
    { key: "brands", header: t("salesmenKpi.topBrands"), render: (row) => <BreakdownCell items={row.topSoldBrands} /> },
    { key: "colors", header: t("salesmenKpi.topColors"), render: (row) => <BreakdownCell items={row.topSoldColors} /> },
    { key: "branches", header: t("salesmenKpi.topBranches"), render: (row) => <BreakdownCell items={row.topSoldBranches} /> },
    { key: "groups", header: t("salesmenKpi.topCustomerGroups"), render: (row) => <BreakdownCell items={row.topCustomerGroups} /> },
  ];

  const reservationBreakdownColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "models", header: t("salesmenKpi.topModels"), render: (row) => <BreakdownCell items={row.topReservedModels} /> },
    { key: "brands", header: t("salesmenKpi.topBrands"), render: (row) => <BreakdownCell items={row.topReservedBrands} /> },
    { key: "colors", header: t("salesmenKpi.topColors"), render: (row) => <BreakdownCell items={row.topReservedColors} /> },
    { key: "branches", header: t("salesmenKpi.topBranches"), render: (row) => <BreakdownCell items={row.topReservedBranches} /> },
    { key: "groups", header: t("salesmenKpi.topCustomerGroups"), render: (row) => <BreakdownCell items={row.topReservationCustomerGroups} /> },
  ];

  const reservationDetailsColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "retail", header: t("salesmenKpi.retailReservations"), render: (row) => formatNumber(row.retailReservationsCount) },
    { key: "brokers", header: t("salesmenKpi.brokersReservations"), render: (row) => formatNumber(row.brokersReservationsCount) },
    { key: "fleet", header: t("salesmenKpi.fleetReservations"), render: (row) => formatNumber(row.fleetReservationsCount) },
    { key: "bank", header: t("salesmenKpi.bankReservations"), render: (row) => formatNumber(row.bankReservationsCount) },
    { key: "reserve", header: t("status.reserve"), render: (row) => formatNumber(row.reserveCount) },
    { key: "contract", header: t("status.contract"), render: (row) => formatNumber(row.contractCount) },
    { key: "cession", header: t("status.cession"), render: (row) => formatNumber(row.cessionCount) },
    { key: "companyReservation", header: t("status.reservationForCompanies"), render: (row) => formatNumber(row.companyReservationCount) },
  ];

  const missedColumns: DataTableColumn<SalesmanKpi>[] = [
    { key: "salesman", header: t("salesmenKpi.salesman"), render: (row) => row.salesman },
    { key: "missingModels", header: t("salesmenKpi.missingModels"), render: (row) => <NamesOnlyCell items={row.missingModels} /> },
  ];

  return (
    <>
      <PageHeader title={t("salesmenKpi.title")} description={t("salesmenKpi.description")} />
      <FilterBar filters={filters} inventoryItems={inventoryData.inventoryItems} sources={inventoryData.sources} onChange={setFilters} />
      <div className="report-actions">
        <button className="report-button primary" type="button" onClick={() => exportExcel("salesmen-kpi.xls", report.salesmen)}>{t("actions.exportExcel")}</button>
        <button className="report-button" type="button" onClick={() => exportCsv("salesmen-kpi.csv", report.salesmen)}>{t("actions.exportCsv")}</button>
      </div>
      <MetaStrip meta={inventoryData.meta} />
      <ApiState
        loading={inventoryData.isInitialLoading}
        refreshing={inventoryData.isRefreshing}
        error={inventoryData.error}
        partial={(inventoryData.meta?.failedSources ?? 0) > 0}
        empty={!inventoryData.isInitialLoading && report.salesmen.length === 0}
        onRetry={() => void inventoryData.refreshData()}
        onReset={resetFilters}
      />

      <section className={styles.metricGrid}>
        <DashboardCard label={t("salesmenKpi.totalSalesmen")} value={formatNumber(report.totalSalesmen)} trend={t("summary.liveData")} />
        <DashboardCard label={t("salesmenKpi.totalSoldUnits")} value={formatNumber(report.totalSoldUnits)} trend={t("transaction.totalSales")} tone="positive" />
        <DashboardCard label={t("salesmenKpi.totalReservedUnits")} value={formatNumber(report.totalReservedUnits)} trend={t("transaction.totalReservations")} tone="blue" />
        <DashboardCard label={t("transaction.externalSales")} value={formatNumber(report.externalSoldUnits)} trend={t("salesmenKpi.soldUnits")} tone="green" />
        <DashboardCard label={t("transaction.internalSales")} value={formatNumber(report.internalSoldUnits)} trend={t("transaction.internal")} tone="warning" />
        <DashboardCard label={t("transaction.externalReservations")} value={formatNumber(report.externalReservedUnits)} trend={t("salesmenKpi.reservedUnits")} tone="purple" />
        <DashboardCard label={t("transaction.internalReservations")} value={formatNumber(report.internalReservedUnits)} trend={t("transaction.internal")} tone="pink" />
        <DashboardCard label={t("salesmenKpi.totalRevenue")} value={formatMoneyTotalsCompact(report.totalRevenue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.totalRevenue, locale, currencyLabels, selectedCurrencies)} tone="positive" />
        <DashboardCard label={t("salesmenKpi.totalReservationValue")} value={formatMoneyTotalsCompact(report.totalReservationValue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.totalReservationValue, locale, currencyLabels, selectedCurrencies)} tone="blue" />
        <DashboardCard label={t("transaction.externalRevenue")} value={formatMoneyTotalsCompact(report.externalRevenue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.externalRevenue, locale, currencyLabels, selectedCurrencies)} tone="green" />
        <DashboardCard label={t("transaction.internalRevenue")} value={formatMoneyTotalsCompact(report.internalRevenue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.internalRevenue, locale, currencyLabels, selectedCurrencies)} tone="warning" />
        <DashboardCard label={t("salesmenKpi.externalReservationValue")} value={formatMoneyTotalsCompact(report.externalReservationValue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.externalReservationValue, locale, currencyLabels, selectedCurrencies)} tone="purple" />
        <DashboardCard label={t("salesmenKpi.internalReservationValue")} value={formatMoneyTotalsCompact(report.internalReservationValue, locale, selectedCurrencies)} trend={formatMoneyTotalsBreakdown(report.internalReservationValue, locale, currencyLabels, selectedCurrencies)} tone="pink" />
        <DashboardCard label={t("salesmenKpi.averageSalesPerSalesman")} value={formatNumber(report.averageSalesPerSalesman)} trend={t("salesmenKpi.shareOfSales")} />
        <DashboardCard label={t("salesmenKpi.averageReservationsPerSalesman")} value={formatNumber(report.averageReservationsPerSalesman)} trend={t("salesmenKpi.shareOfReservations")} />
        <DashboardCard label={t("salesmenKpi.topSalesmanByUnits")} value={report.topSalesmanByUnits} trend={t("salesmenKpi.soldUnits")} tone="warning" />
        <DashboardCard label={t("salesmenKpi.topSalesmanByRevenue")} value={report.topSalesmanByRevenue} trend={t("salesmenKpi.revenue")} tone="warning" />
        <DashboardCard label={t("salesmenKpi.topSalesmanByReservations")} value={report.topSalesmanByReservations} trend={t("salesmenKpi.reservedUnits")} tone="blue" />
        <DashboardCard label={t("salesmenKpi.topSalesmanByReservationValue")} value={report.topSalesmanByReservationValue} trend={t("salesmenKpi.reservationValue")} tone="purple" />
      </section>

      <ChartGrid>
        <BarChartCard title={t("charts.salesBySalesman")} subtitle={t("charts.top10")} insight={`${formatNumber(salesBySalesman[0]?.value ?? 0)} ${salesBySalesman[0]?.name ?? ""}`} data={salesBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.reservationsBySalesman")} subtitle={t("charts.top10")} insight={`${formatNumber(reservationsBySalesman[0]?.value ?? 0)} ${reservationsBySalesman[0]?.name ?? ""}`} data={reservationsBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.revenueBySalesman")} subtitle="USD" insight={`${formatNumber(revenueBySalesman[0]?.value ?? 0)} USD`} data={revenueBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.reservationValueBySalesman")} subtitle="USD" insight={`${formatNumber(reservationValueBySalesman[0]?.value ?? 0)} USD`} data={reservationValueBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.averageSoldPriceBySalesman")} subtitle="USD" insight={`${formatNumber(averagePriceBySalesman[0]?.value ?? 0)} USD`} data={averagePriceBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("salesmenKpi.topModels")} subtitle={t("charts.top10")} insight={t("charts.liveFilteredData")} data={modelCoverageBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("salesmenKpi.reservationTopModels")} subtitle={t("charts.top10")} insight={t("charts.liveFilteredData")} data={reservationModelCoverageBySalesman} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("salesmenKpi.reservationStatusMix")} subtitle={t("filters.status")} insight={t("charts.liveFilteredData")} data={reservationStatusMix} isLoading={inventoryData.isInitialLoading} />
        <BarChartCard title={t("charts.missedOpportunitiesBySalesman")} subtitle={t("charts.top10")} insight={t("salesmenKpi.carsTheyDoNotSell")} data={missedBySalesman} isLoading={inventoryData.isInitialLoading} />
      </ChartGrid>

      <section className={styles.sectionGrid}>
        <div className={styles.wide}>
          <SectionCard title={t("salesmenKpi.salesmenRanking")} eyebrow={t("salesmenKpi.carsTheySell")} action={formatNumber(report.salesmen.length)}>
            <DataTable columns={rankingColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
          </SectionCard>
        </div>
        <div className={styles.wide}>
          <SectionCard title={t("salesmenKpi.reservationsRanking")} eyebrow={t("salesmenKpi.carsTheyReserve")} action={formatNumber(report.totalReservedUnits)}>
            <DataTable columns={reservationRankingColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
          </SectionCard>
        </div>
        <SectionCard title={t("salesmenKpi.soldCarsBreakdown")} eyebrow={t("salesmenKpi.carsTheySell")}>
          <DataTable columns={breakdownColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
        </SectionCard>
        <SectionCard title={t("salesmenKpi.reservedCarsBreakdown")} eyebrow={t("salesmenKpi.carsTheyReserve")}>
          <DataTable columns={reservationBreakdownColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
        </SectionCard>
        <SectionCard title={t("salesmenKpi.reservationStatusMix")} eyebrow={t("filters.status")}>
          <DataTable columns={reservationStatusColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
        </SectionCard>
        <SectionCard title={t("salesmenKpi.missedOpportunitiesReview")} eyebrow={t("salesmenKpi.carsTheyDoNotSell")}>
          <DataTable columns={missedColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
        </SectionCard>
        <div className={styles.wide}>
          <SectionCard title={t("salesmenKpi.salesmenRanking")} eyebrow={t("salesmenKpi.soldCarsBreakdown")}>
            <DataTable columns={detailsColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
          </SectionCard>
        </div>
        <div className={styles.wide}>
          <SectionCard title={t("salesmenKpi.reservationsRanking")} eyebrow={t("salesmenKpi.reservedCarsBreakdown")}>
            <DataTable columns={reservationDetailsColumns} rows={report.salesmen} isLoading={inventoryData.isInitialLoading} emptyMessage={t("salesmenKpi.noSalesmenData")} />
          </SectionCard>
        </div>
      </section>
    </>
  );
}
