"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
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
import styles from "./page.module.css";

const BRANDS: MonthlySalesBrand[] = ["ROX", "FORTHING", "JAC"];

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  salesLocation: string;
  salesman: string;
  brand: string;
  country: string;
  sourceId: string;
  branch: string;
  warehouse: string;
  model: string;
  type: string;
  customerGroup: string;
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
        salesLocation: filters.salesLocation || undefined,
        salesman: filters.salesman || undefined,
        brands: filters.brand || undefined,
        countries: filters.country || undefined,
        sourceIds: filters.sourceId || undefined,
        branches: filters.branch || undefined,
        warehouses: filters.warehouse || undefined,
        models: filters.model || undefined,
        types: filters.type || undefined,
        customerGroups: filters.customerGroup || undefined,
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
          <Field label={t("monthlySalesReport.salesLocation")}>
            <select
              value={filters.salesLocation}
              onChange={(event) =>
                setFilters((current) => ({ ...current, salesLocation: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allLocations")}</option>
              {(report?.options.salesLocations ?? []).map((location) => (
                <option value={location} key={location}>
                  {translateUnmapped(location, t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("monthlySalesReport.salesman")}>
            <select
              value={filters.salesman}
              onChange={(event) =>
                setFilters((current) => ({ ...current, salesman: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allSalesmen")}</option>
              {(report?.options.salesmen ?? []).map((salesman) => (
                <option value={salesman} key={salesman}>
                  {salesman}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("monthlySalesReport.brand")}>
            <select
              value={filters.brand}
              onChange={(event) =>
                setFilters((current) => ({ ...current, brand: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allBrands")}</option>
              {BRANDS.map((brand) => (
                <option value={brand} key={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.country")}>
            <select
              value={filters.country}
              onChange={(event) =>
                setFilters((current) => ({ ...current, country: event.target.value }))
              }
            >
              <option value="">{t("topbar.allCountries")}</option>
              {(report?.options.countries ?? []).map((country) => (
                <option value={country} key={country}>
                  {country}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.source")}>
            <select
              value={filters.sourceId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sourceId: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allSources")}</option>
              {(report?.options.sources ?? []).map((source) => (
                <option value={source.value} key={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.branch")}>
            <select
              value={filters.branch}
              onChange={(event) =>
                setFilters((current) => ({ ...current, branch: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allBranches")}</option>
              {(report?.options.branches ?? []).map((branch) => (
                <option value={branch} key={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.warehouse")}>
            <select
              value={filters.warehouse}
              onChange={(event) =>
                setFilters((current) => ({ ...current, warehouse: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allWarehouses")}</option>
              {(report?.options.warehouses ?? []).map((warehouse) => (
                <option value={warehouse} key={warehouse}>
                  {warehouse}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.model")}>
            <select
              value={filters.model}
              onChange={(event) =>
                setFilters((current) => ({ ...current, model: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allModels")}</option>
              {(report?.options.models ?? []).map((model) => (
                <option value={model} key={model}>
                  {model}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.type")}>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({ ...current, type: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allTypes")}</option>
              {(report?.options.types ?? []).map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filters.customerGroup")}>
            <select
              value={filters.customerGroup}
              onChange={(event) =>
                setFilters((current) => ({ ...current, customerGroup: event.target.value }))
              }
            >
              <option value="">{t("monthlySalesReport.allCustomerGroups")}</option>
              {(report?.options.customerGroups ?? []).map((group) => (
                <option value={group} key={group}>
                  {group}
                </option>
              ))}
            </select>
          </Field>
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
    salesLocation: "",
    salesman: "",
    brand: "",
    country: "",
    sourceId: "",
    branch: "",
    warehouse: "",
    model: "",
    type: "",
    customerGroup: "",
    search: "",
  };
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
