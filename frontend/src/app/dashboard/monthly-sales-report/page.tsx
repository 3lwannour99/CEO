"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
import { MultiSelect } from "@/components/MultiSelect/MultiSelect";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { useI18n } from "@/i18n/useI18n";
import { formatNumber } from "@/lib/apiClient";
import { getPublicMonthlySalesReport } from "@/services/monthlySalesApi";
import type {
  MonthlySalesBrand,
  MonthlySalesReportResponse,
  MonthlySalesReportRow,
  MonthlySalesReportTotal,
} from "@/types/monthlySales";
import type { PageFilterOption } from "@/types/inventory";
import styles from "./page.module.css";

const BRANDS: MonthlySalesBrand[] = ["ROX", "FORTHING", "JAC"];

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  salesLocations: string[];
  salesmen: string[];
  brands: string[];
  countries: string[];
  sourceIds: string[];
  branches: string[];
  warehouses: string[];
  models: string[];
  types: string[];
  customerGroups: string[];
  search: string;
}

export default function MonthlySalesReportPage() {
  const { language, t } = useI18n();
  const [filters, setFilters] = useState<ReportFilters>(() => defaultFilters());
  const [report, setReport] = useState<MonthlySalesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPublicMonthlySalesReport({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        salesLocation: toQueryList(filters.salesLocations),
        salesman: toQueryList(filters.salesmen),
        brands: toQueryList(filters.brands),
        countries: toQueryList(filters.countries),
        sourceIds: toQueryList(filters.sourceIds),
        branches: toQueryList(filters.branches),
        warehouses: toQueryList(filters.warehouses),
        models: toQueryList(filters.models),
        types: toQueryList(filters.types),
        customerGroups: toQueryList(filters.customerGroups),
        search: filters.search || undefined,
      });
      setReport(response);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("monthlySalesReport.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadReport();
    });
  }, [loadReport]);

  useEffect(() => {
    function handleFocus() {
      void loadReport();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadReport]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, MonthlySalesReportRow[]>();
    for (const row of report?.rows ?? []) {
      const rows = groups.get(row.salesLocation) ?? [];
      rows.push(row);
      groups.set(row.salesLocation, rows);
    }
    return (report?.locationTotals ?? []).map((total) => ({
      location: total.salesLocation ?? "",
      rows: groups.get(total.salesLocation ?? "") ?? [],
      total,
    }));
  }, [report]);

  const reportOptions = useMemo(() => {
    const options = report?.options;

    return {
      salesLocations: toOptions(options?.salesLocations ?? []),
      salesmen: toOptions(options?.salesmen ?? []),
      brands: toOptions(options?.brands ?? BRANDS),
      countries: toOptions(options?.countries ?? []),
      sources: options?.sources ?? [],
      branches: toOptions(options?.branches ?? []),
      warehouses: toOptions(options?.warehouses ?? []),
      models: toOptions(options?.models ?? []),
      types: toOptions(options?.types ?? []),
      customerGroups: toOptions(options?.customerGroups ?? []),
    };
  }, [report]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("monthlySalesReport.publicReport")}</p>
          <h1>{t("monthlySalesReport.title")}</h1>
          <p className={styles.description}>{t("monthlySalesReport.description")}</p>
        </div>
        <div className={styles.headerControls}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className={styles.filters} aria-label={t("monthlySalesReport.filters")}>
        <div className={styles.filterHeader}>
          <div>
            <h2>{t("monthlySalesReport.filters")}</h2>
            <p>{t("monthlySalesReport.dateRuleNote")}</p>
          </div>
        </div>
        <div className={styles.filterGrid}>
          <Field label={t("filters.fromDate")}>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateDate("dateFrom", event.target.value, setFilters)}
            />
          </Field>
          <Field label={t("filters.toDate")}>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateDate("dateTo", event.target.value, setFilters)}
            />
          </Field>
          <ReportMultiSelect label={t("monthlySalesReport.salesLocation")} options={reportOptions.salesLocations} values={filters.salesLocations} onChange={(salesLocations) => setFilters((current) => ({ ...current, salesLocations }))} />
          <ReportMultiSelect label={t("monthlySalesReport.salesman")} options={reportOptions.salesmen} values={filters.salesmen} onChange={(salesmen) => setFilters((current) => ({ ...current, salesmen }))} />
          <ReportMultiSelect label={t("monthlySalesReport.brand")} options={reportOptions.brands} values={filters.brands} onChange={(brands) => setFilters((current) => ({ ...current, brands }))} />
          <ReportMultiSelect label={t("filters.country")} options={reportOptions.countries} values={filters.countries} onChange={(countries) => setFilters((current) => ({ ...current, countries }))} />
          <ReportMultiSelect label={t("filters.source")} options={reportOptions.sources} values={filters.sourceIds} onChange={(sourceIds) => setFilters((current) => ({ ...current, sourceIds }))} />
          <ReportMultiSelect label={t("filters.branch")} options={reportOptions.branches} values={filters.branches} onChange={(branches) => setFilters((current) => ({ ...current, branches }))} />
          <ReportMultiSelect label={t("filters.warehouse")} options={reportOptions.warehouses} values={filters.warehouses} onChange={(warehouses) => setFilters((current) => ({ ...current, warehouses }))} />
          <ReportMultiSelect label={t("filters.model")} options={reportOptions.models} values={filters.models} onChange={(models) => setFilters((current) => ({ ...current, models }))} />
          <ReportMultiSelect label={t("filters.type")} options={reportOptions.types} values={filters.types} onChange={(types) => setFilters((current) => ({ ...current, types }))} />
          <ReportMultiSelect label={t("filters.customerGroup")} options={reportOptions.customerGroups} values={filters.customerGroups} onChange={(customerGroups) => setFilters((current) => ({ ...current, customerGroups }))} />
          <Field className={styles.searchField} label={t("filters.search")}>
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
            />
          </Field>
          <div className={styles.filterActions}>
            <button type="button" onClick={() => setFilters(defaultFilters())}>
              {t("filters.resetFilters")}
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => void loadReport()}
              disabled={loading}
            >
              {loading ? t("common.loading") : t("common.refresh")}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}
      <section className={styles.reportCard}>
        <div className={styles.reportMeta}>
          <strong>
            {t("monthlySalesReport.period")}: {report?.dateFrom ?? filters.dateFrom} -{" "}
            {report?.dateTo ?? filters.dateTo}
          </strong>
          <span>
            {t("common.lastUpdated")}:{" "}
            {report ? new Date(report.generatedAt).toLocaleString(language) : "-"}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.reportTable}>
            <thead>
              <ReportHeaderRows t={t} />
            </thead>
            <tbody>
              {loading && !report ? (
                <tr>
                  <td colSpan={11} className={styles.messageCell}>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className={styles.messageCell}>
                    {t("monthlySalesReport.noData")}
                  </td>
                </tr>
              ) : (
                groupedRows.map(({ location, rows, total }) => {
                  return [
                    ...rows.map((row, index) => (
                      <tr key={`${location}-${row.salesmanName}`}>
                        {index === 0 ? (
                          <th className={styles.locationCell} rowSpan={rows.length}>
                            {translateUnmapped(location, t)}
                          </th>
                        ) : null}
                        <td className={styles.salesmanCell}>
                          {row.salesmanName}
                          {row.groupName ? <small>{row.groupName}</small> : null}
                          {!row.isMapped ? <span>{t("monthlySalesReport.unmapped")}</span> : null}
                        </td>
                        <RowCountCells value={row} />
                      </tr>
                    )),
                    <TotalRow
                      key={`${location}-total`}
                      label={`${translateUnmapped(location, t)} - ${t("monthlySalesReport.locationTotal")}`}
                      total={total}
                    />,
                  ];
                })
              )}
            </tbody>
            {report ? (
              <tfoot>
                <TotalRow label={t("monthlySalesReport.grandTotal")} total={report.grandTotal} />
                <ReportHeaderRows t={t} repeated />
              </tfoot>
            ) : null}
          </table>
        </div>
        <p className={styles.note}>{t("monthlySalesReport.dateRuleNote")}</p>
      </section>
    </main>
  );
}

function BrandCells({ value }: { value: MonthlySalesReportRow | MonthlySalesReportTotal }) {
  return (
    <>
      {BRANDS.flatMap((brand) => [
        <td key={`${brand}-r`}>{formatNumber(value.brands[brand].reservations)}</td>,
        <td key={`${brand}-i`}>{formatNumber(value.brands[brand].invoiced)}</td>,
      ])}
      <td className={styles.totalCell}>{formatNumber(totalUnits(value))}</td>
    </>
  );
}

function ReportHeaderRows({
  t,
  repeated = false,
}: {
  t: (key: string) => string;
  repeated?: boolean;
}) {
  const className = repeated ? styles.repeatedHeader : undefined;

  if (repeated) {
    return (
      <>
        <tr className={className}>
          <th rowSpan={2}>{t("monthlySalesReport.salesLocation")}</th>
          <th rowSpan={2}>{t("monthlySalesReport.salesman")}</th>
          {BRANDS.flatMap((brand) => [
            <th key={`${brand}-reservations`}>{t("monthlySalesReport.reservations")}</th>,
            <th key={`${brand}-invoiced`}>{t("monthlySalesReport.invoiced")}</th>,
          ])}
          <th rowSpan={2}>{t("monthlySalesReport.total")}</th>
          <th rowSpan={2}>{t("monthlySalesReport.target")}</th>
          <th rowSpan={2}>{t("monthlySalesReport.achievement")}</th>
        </tr>
        <tr className={className}>
          {BRANDS.map((brand) => (
            <th colSpan={2} key={brand}>
              {brand}
            </th>
          ))}
        </tr>
      </>
    );
  }

  return (
    <>
      <tr className={className}>
        <th rowSpan={2}>{t("monthlySalesReport.salesLocation")}</th>
        <th rowSpan={2}>{t("monthlySalesReport.salesman")}</th>
        {BRANDS.map((brand) => (
          <th colSpan={2} key={brand}>
            {brand}
          </th>
        ))}
        <th rowSpan={2}>{t("monthlySalesReport.total")}</th>
        <th rowSpan={2}>{t("monthlySalesReport.target")}</th>
        <th rowSpan={2}>{t("monthlySalesReport.achievement")}</th>
      </tr>
      <tr className={className}>
        {BRANDS.flatMap((brand) => [
          <th key={`${brand}-reservations`}>{t("monthlySalesReport.reservations")}</th>,
          <th key={`${brand}-invoiced`}>{t("monthlySalesReport.invoiced")}</th>,
        ])}
      </tr>
    </>
  );
}

function RowCountCells({ value }: { value: MonthlySalesReportRow }) {
  return (
    <>
      <BrandCells value={value} />
      <td className={styles.targetCell}>{formatNumber(value.target)}</td>
      <td className={styles.achievementCell}>
        {formatAchievement(value.achievementPercentage)}
      </td>
    </>
  );
}

function TotalRow({ label, total }: { label: string; total: MonthlySalesReportTotal }) {
  return (
    <tr className={styles.totalRow}>
      <th colSpan={2}>{label}</th>
      <BrandCells value={total} />
      <td className={styles.targetCell}>{formatNumber(total.target)}</td>
      <td className={styles.achievementCell}>{formatAchievement(total.achievementPercentage)}</td>
    </tr>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatAchievement(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)}%`;
}

function totalUnits(value: MonthlySalesReportRow | MonthlySalesReportTotal) {
  return BRANDS.reduce(
    (total, brand) =>
      total + value.brands[brand].invoiced + value.brands[brand].reservations,
    0,
  );
}

function defaultFilters(): ReportFilters {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    dateFrom: toDateInput(new Date(year, month, 1)),
    dateTo: toDateInput(new Date(year, month + 1, 0)),
    salesLocations: [],
    salesmen: [],
    brands: [],
    countries: [],
    sourceIds: [],
    branches: [],
    warehouses: [],
    models: [],
    types: [],
    customerGroups: [],
    search: "",
  };
}

function ReportMultiSelect(props: {
  label: string;
  options: PageFilterOption[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return <MultiSelect {...props} />;
}

function toOptions(values: string[]): PageFilterOption[] {
  return values.map((value) => ({ value, label: value }));
}

function toQueryList(values: string[]) {
  return values.length > 0 ? values.join(",") : undefined;
}

function updateDate(
  field: "dateFrom" | "dateTo",
  value: string,
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>,
) {
  setFilters((current) => {
    if (!value) return { ...current, [field]: value };
    const [year, month] = value.split("-").map(Number);
    const lastDay = toDateInput(new Date(year, month, 0));
    return field === "dateFrom"
      ? {
          ...current,
          dateFrom: value,
          dateTo: current.dateTo.startsWith(value.slice(0, 7)) ? current.dateTo : lastDay,
        }
      : {
          ...current,
          dateTo: value,
          dateFrom: current.dateFrom.startsWith(value.slice(0, 7))
            ? current.dateFrom
            : `${value.slice(0, 7)}-01`,
        };
  });
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function translateUnmapped(value: string, t: (key: string) => string) {
  return value === "Unmapped" ? t("monthlySalesReport.unmapped") : value;
}
