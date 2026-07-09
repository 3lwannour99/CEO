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

  const canExport = Boolean(report && !loading);

  function exportReportExcel() {
    if (!report) return;
    downloadMonthlySalesExcel(report, t);
  }

  function exportReportPdf() {
    if (!report) return;
    downloadMonthlySalesPdf(report, t);
  }

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
          <ReportMultiSelect
            label={t("monthlySalesReport.salesLocation")}
            options={reportOptions.salesLocations}
            values={filters.salesLocations}
            onChange={(salesLocations) => setFilters((current) => ({ ...current, salesLocations }))}
          />
          <ReportMultiSelect
            label={t("monthlySalesReport.salesman")}
            options={reportOptions.salesmen}
            values={filters.salesmen}
            onChange={(salesmen) => setFilters((current) => ({ ...current, salesmen }))}
          />
          <ReportMultiSelect
            label={t("monthlySalesReport.brand")}
            options={reportOptions.brands}
            values={filters.brands}
            onChange={(brands) => setFilters((current) => ({ ...current, brands }))}
          />
          <ReportMultiSelect
            label={t("filters.country")}
            options={reportOptions.countries}
            values={filters.countries}
            onChange={(countries) => setFilters((current) => ({ ...current, countries }))}
          />
          <ReportMultiSelect
            label={t("filters.source")}
            options={reportOptions.sources}
            values={filters.sourceIds}
            onChange={(sourceIds) => setFilters((current) => ({ ...current, sourceIds }))}
          />
          <ReportMultiSelect
            label={t("filters.branch")}
            options={reportOptions.branches}
            values={filters.branches}
            onChange={(branches) => setFilters((current) => ({ ...current, branches }))}
          />
          <ReportMultiSelect
            label={t("filters.warehouse")}
            options={reportOptions.warehouses}
            values={filters.warehouses}
            onChange={(warehouses) => setFilters((current) => ({ ...current, warehouses }))}
          />
          <ReportMultiSelect
            label={t("filters.model")}
            options={reportOptions.models}
            values={filters.models}
            onChange={(models) => setFilters((current) => ({ ...current, models }))}
          />
          <ReportMultiSelect
            label={t("filters.type")}
            options={reportOptions.types}
            values={filters.types}
            onChange={(types) => setFilters((current) => ({ ...current, types }))}
          />
          <ReportMultiSelect
            label={t("filters.customerGroup")}
            options={reportOptions.customerGroups}
            values={filters.customerGroups}
            onChange={(customerGroups) => setFilters((current) => ({ ...current, customerGroups }))}
          />
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
          <div className={styles.reportMetaActions}>
            <span>
              {t("common.lastUpdated")}:{" "}
              {report ? new Date(report.generatedAt).toLocaleString(language) : "-"}
            </span>
            <div className={styles.exportActions}>
              <button type="button" disabled={!canExport} onClick={exportReportExcel}>
                {t("monthlySalesReport.exportExcel")}
              </button>
              <button type="button" disabled={!canExport} onClick={exportReportPdf}>
                {t("monthlySalesReport.exportPdf")}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.reportTable}>
            <thead>
              <ReportHeaderRows t={t} />
            </thead>
            <tbody>
              {loading && !report ? (
                <tr>
                  <td colSpan={12} className={styles.messageCell}>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className={styles.messageCell}>
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
      <td className={styles.totalCell}>{formatNumber(totalReservations(value))}</td>
      <td className={styles.totalCell}>{formatNumber(value.invoicedTotal)}</td>
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
          <th rowSpan={2}>{t("monthlySalesReport.totalReserved")}</th>
          <th rowSpan={2}>{t("monthlySalesReport.totalInvoiced")}</th>
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
        <th rowSpan={2}>{t("monthlySalesReport.totalReserved")}</th>
        <th rowSpan={2}>{t("monthlySalesReport.totalInvoiced")}</th>
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
      <td className={styles.achievementCell}>{formatAchievement(achievementFromInvoiced(value))}</td>
    </>
  );
}

function TotalRow({ label, total }: { label: string; total: MonthlySalesReportTotal }) {
  return (
    <tr className={styles.totalRow}>
      <th colSpan={2}>{label}</th>
      <BrandCells value={total} />
      <td className={styles.targetCell}>{formatNumber(total.target)}</td>
      <td className={styles.achievementCell}>{formatAchievement(achievementFromInvoiced(total))}</td>
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

function achievementFromInvoiced(value: MonthlySalesReportRow | MonthlySalesReportTotal) {
  return value.target > 0 ? (value.invoicedTotal / value.target) * 100 : null;
}

function totalReservations(value: MonthlySalesReportRow | MonthlySalesReportTotal) {
  return "reservedTotal" in value && typeof value.reservedTotal === "number"
    ? value.reservedTotal
    : BRANDS.reduce((total, brand) => total + value.brands[brand].reservations, 0);
}

function isReportRow(value: MonthlySalesReportRow | MonthlySalesReportTotal): value is MonthlySalesReportRow {
  return "salesmanName" in value;
}

function downloadMonthlySalesExcel(report: MonthlySalesReportResponse, t: (key: string) => string) {
  const html = buildMonthlySalesExcelHtml(report, t);
  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = monthlySalesReportFileName(report, "xls");
  link.click();
  URL.revokeObjectURL(url);
}

function downloadMonthlySalesPdf(report: MonthlySalesReportResponse, t: (key: string) => string) {
  const pdf = buildMonthlySalesPdf(report, t);
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = monthlySalesReportFileName(report, "pdf");
  link.click();
  URL.revokeObjectURL(url);
}

function buildMonthlySalesPdf(report: MonthlySalesReportResponse, t: (key: string) => string) {
  const rows = buildMonthlySalesPdfRows(report, t);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 10;
  const tableTop = 52;
  const tableWidth = pageWidth - margin * 2;
  const columnWidths = [52, 86, 31, 31, 31, 31, 31, 31, 42, 42, 36, 40];
  const scale = tableWidth / columnWidths.reduce((sum, width) => sum + width, 0);
  const widths = columnWidths.map((width) => width * scale);
  const rowHeight = Math.max(4.8, Math.min(11, (pageHeight - tableTop - margin) / (rows.length + 2)));
  const fontSize = Math.max(2.6, Math.min(5.8, rowHeight * 0.52));
  const commands: string[] = [
    "1 1 1 rg 0 0 595 842 re f",
    "0.067 0.094 0.153 rg",
    textCommand(t("monthlySalesReport.title"), pageWidth / 2, pageHeight - 18, 9, true, "center"),
    textCommand(
      `${t("monthlySalesReport.period")}: ${report.dateFrom} - ${report.dateTo}`,
      pageWidth / 2,
      pageHeight - 30,
      5.5,
      false,
      "center",
    ),
  ];

  let y = pageHeight - tableTop;
  drawPdfHeader(commands, margin, y, widths, rowHeight, fontSize, t);
  y -= rowHeight * 2;
  for (const row of rows) {
    drawPdfRow(commands, margin, y, widths, rowHeight, fontSize, row);
    y -= rowHeight;
  }

  return createPdf(commands.join("\n"));
}

function buildMonthlySalesPdfRows(report: MonthlySalesReportResponse, t: (key: string) => string) {
  const groups = new Map<string, MonthlySalesReportRow[]>();
  for (const row of report.rows) {
    const rows = groups.get(row.salesLocation) ?? [];
    rows.push(row);
    groups.set(row.salesLocation, rows);
  }

  const rows: Array<{ cells: Array<string | number>; kind: "data" | "total" | "grand" }> = [];
  for (const total of report.locationTotals) {
    const salesLocation = total.salesLocation ?? "";
    for (const row of groups.get(salesLocation) ?? []) {
      rows.push(pdfRow(row, translateUnmapped(salesLocation, t), row.salesmanName, "data"));
    }
    rows.push(
      pdfRow(
        total,
        `${translateUnmapped(salesLocation, t)} - ${t("monthlySalesReport.locationTotal")}`,
        "",
        "total",
      ),
    );
  }
  rows.push(pdfRow(report.grandTotal, t("monthlySalesReport.grandTotal"), "", "grand"));
  return rows;
}

function drawPdfHeader(
  commands: string[],
  x: number,
  y: number,
  widths: number[],
  rowHeight: number,
  fontSize: number,
  t: (key: string) => string,
) {
  const header1 = [
    t("monthlySalesReport.salesLocation"),
    t("monthlySalesReport.salesman"),
    ...BRANDS.flatMap((brand) => [brand, ""]),
    t("monthlySalesReport.totalReserved"),
    t("monthlySalesReport.totalInvoiced"),
    t("monthlySalesReport.target"),
    t("monthlySalesReport.achievement"),
  ];
  const header2 = [
    "",
    "",
    ...BRANDS.flatMap(() => [
      t("monthlySalesReport.reservations"),
      t("monthlySalesReport.invoiced"),
    ]),
    "",
    "",
    "",
    "",
  ];

  drawPdfRow(commands, x, y, widths, rowHeight, fontSize, { cells: header1, kind: "total" });
  drawPdfRow(commands, x, y - rowHeight, widths, rowHeight, fontSize, { cells: header2, kind: "total" });
}

function drawPdfRow(
  commands: string[],
  x: number,
  y: number,
  widths: number[],
  rowHeight: number,
  fontSize: number,
  row: { cells: Array<string | number>; kind: "data" | "total" | "grand" },
) {
  let currentX = x;
  const fill = row.kind === "grand" ? "0.82 0.84 0.87" : row.kind === "total" ? "0.95 0.96 0.97" : "1 1 1";
  for (let index = 0; index < widths.length; index += 1) {
    const width = widths[index];
    const cellFill = row.kind === "data" && index === 0 ? "0.88 0.95 0.99" : fill;
    commands.push(`${cellFill} rg ${num(currentX)} ${num(y - rowHeight)} ${num(width)} ${num(rowHeight)} re f`);
    commands.push(`0.42 0.45 0.50 RG ${num(currentX)} ${num(y - rowHeight)} ${num(width)} ${num(rowHeight)} re S`);
    commands.push(
      textCommand(
        row.cells[index] ?? "",
        currentX + width / 2,
        y - rowHeight / 2 - fontSize * 0.35,
        fontSize,
        row.kind !== "data" || index === 0,
        "center",
        width - 2,
      ),
    );
    currentX += width;
  }
}

function createPdf(content: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  const parts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(parts.join("").length);
    parts.push(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`);
  }
  const xref = parts.join("").length;
  parts.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) {
    parts.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return parts.join("");
}

function textCommand(
  value: string | number,
  x: number,
  y: number,
  size: number,
  bold = false,
  align: "left" | "center" = "left",
  maxWidth = 999,
) {
  const text = fitPdfText(String(value), size, maxWidth);
  const textWidth = text.length * size * 0.48;
  const adjustedX = align === "center" ? x - textWidth / 2 : x;
  return `0.067 0.094 0.153 rg BT /F${bold ? 2 : 1} ${num(size)} Tf ${num(adjustedX)} ${num(y)} Td (${escapePdfText(text)}) Tj ET`;
}

function fitPdfText(value: string, size: number, maxWidth: number) {
  const cleaned = value.replace(/[^\x20-\x7e]/g, "?");
  const maxChars = Math.max(1, Math.floor(maxWidth / (size * 0.48)));
  return cleaned.length > maxChars ? `${cleaned.slice(0, Math.max(1, maxChars - 1))}.` : cleaned;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function num(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function pdfRow(
  value: MonthlySalesReportRow | MonthlySalesReportTotal,
  location: string,
  salesman: string,
  kind: "data" | "total" | "grand",
) {
  const cells: Array<string | number> = [
    location,
    salesman,
    ...BRANDS.flatMap((brand) => [
      value.brands[brand].reservations,
      value.brands[brand].invoiced,
    ]),
    totalReservations(value),
    value.invoicedTotal,
    formatExportNumber(value.target),
    formatAchievement(achievementFromInvoiced(value)),
  ];

  return { cells, kind };
}

function buildMonthlySalesExcelHtml(report: MonthlySalesReportResponse, t: (key: string) => string) {
  const tableRows = buildMonthlySalesHtmlRows(report, t, "excel");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; }
    th, td {
      border: 1px solid #9aa7b7;
      padding: 4px 5px;
      text-align: center;
      vertical-align: middle;
      mso-number-format: General;
    }
    .title-row th { background: #1f2937; color: #ffffff; font-size: 16pt; font-weight: 700; }
    .meta-row th { background: #e5e7eb; color: #111827; font-weight: 700; }
    .brand-row th, .subheader-row th { background: #dbeafe; color: #111827; font-weight: 700; }
    .location-cell { background: #e0f2fe; font-weight: 700; }
    .salesman-cell { text-align: center; }
    .total-row th, .total-row td { background: #f3f4f6; font-weight: 700; }
    .grand-total-row th, .grand-total-row td { background: #111827; color: #ffffff; font-weight: 700; }
  </style>
</head>
<body>
  <table>
    <colgroup>
      <col style="width: 105px" />
      <col style="width: 145px" />
      ${BRANDS.map(() => '<col style="width: 58px" /><col style="width: 58px" />').join("")}
      <col style="width: 72px" />
      <col style="width: 72px" />
      <col style="width: 64px" />
      <col style="width: 74px" />
    </colgroup>
    <tr class="title-row">
      <th colspan="12">${escapeHtml(t("monthlySalesReport.title"))}</th>
    </tr>
    <tr class="meta-row">
      <th colspan="12">${escapeHtml(t("monthlySalesReport.period"))}: ${escapeHtml(report.dateFrom)} - ${escapeHtml(report.dateTo)}</th>
    </tr>
    ${monthlySalesExcelHeaderRows(t)}
    ${tableRows.join("")}
  </table>
</body>
</html>`;
}

function buildMonthlySalesHtmlRows(
  report: MonthlySalesReportResponse,
  t: (key: string) => string,
  mode: "excel" | "pdf",
) {
  const groups = new Map<string, MonthlySalesReportRow[]>();
  for (const row of report.rows) {
    const rows = groups.get(row.salesLocation) ?? [];
    rows.push(row);
    groups.set(row.salesLocation, rows);
  }

  const tableRows: string[] = [];
  for (const total of report.locationTotals) {
    const salesLocation = total.salesLocation ?? "";
    const locationRows = groups.get(salesLocation) ?? [];
    locationRows.forEach((row, index) => {
      tableRows.push(
        monthlySalesExcelDataRow(
          row,
          index === 0 ? translateUnmapped(salesLocation, t) : null,
          Math.max(locationRows.length, 1),
          row.salesmanName,
          "",
          mode,
        ),
      );
    });
    tableRows.push(
      monthlySalesExcelSummaryRow(
        total,
        `${translateUnmapped(salesLocation, t)} - ${t("monthlySalesReport.locationTotal")}`,
        "total-row",
        mode,
      ),
    );
  }
  tableRows.push(
    monthlySalesExcelSummaryRow(
      report.grandTotal,
      t("monthlySalesReport.grandTotal"),
      "grand-total-row",
      mode,
    ),
  );

  return tableRows;
}

function monthlySalesExcelHeaderRows(t: (key: string) => string) {
  return `
    <tr class="brand-row">
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.salesLocation"))}</th>
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.salesman"))}</th>
      ${BRANDS.map((brand) => `<th colspan="2">${escapeHtml(brand)}</th>`).join("")}
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.totalReserved"))}</th>
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.totalInvoiced"))}</th>
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.target"))}</th>
      <th rowspan="2">${escapeHtml(t("monthlySalesReport.achievement"))}</th>
    </tr>
    <tr class="subheader-row">
      ${BRANDS.map(
        () =>
          `<th>${escapeHtml(t("monthlySalesReport.reservations"))}</th><th>${escapeHtml(t("monthlySalesReport.invoiced"))}</th>`,
      ).join("")}
    </tr>`;
}

function monthlySalesExcelDataRow(
  value: MonthlySalesReportRow | MonthlySalesReportTotal,
  locationLabel: string | null,
  locationRowSpan: number,
  salesmanOrTotal: string,
  className: string,
  mode: "excel" | "pdf",
) {
  const title = isReportRow(value) && value.groupName ? `${salesmanOrTotal} - ${value.groupName}` : salesmanOrTotal;
  const salesman = mode === "pdf" ? title : title;
  return `<tr${className ? ` class="${className}"` : ""}>
    ${
      locationLabel === null
        ? ""
        : `<th class="location-cell" rowspan="${locationRowSpan}">${escapeHtml(locationLabel)}</th>`
    }
    <td class="salesman-cell">${escapeHtml(salesman)}</td>
    ${BRANDS.map(
      (brand) =>
        `<td>${value.brands[brand].reservations}</td><td>${value.brands[brand].invoiced}</td>`,
    ).join("")}
    <td>${totalReservations(value)}</td>
    <td>${value.invoicedTotal}</td>
    <td>${formatExportNumber(value.target)}</td>
    <td>${escapeHtml(formatAchievement(achievementFromInvoiced(value)))}</td>
  </tr>`;
}

function monthlySalesExcelSummaryRow(
  value: MonthlySalesReportRow | MonthlySalesReportTotal,
  label: string,
  className: string,
  mode: "excel" | "pdf",
) {
  void mode;
  return `<tr class="${className}">
    <th colspan="2">${escapeHtml(label)}</th>
    ${BRANDS.map(
      (brand) =>
        `<td>${value.brands[brand].reservations}</td><td>${value.brands[brand].invoiced}</td>`,
    ).join("")}
    <td>${totalReservations(value)}</td>
    <td>${value.invoicedTotal}</td>
    <td>${formatExportNumber(value.target)}</td>
    <td>${escapeHtml(formatAchievement(achievementFromInvoiced(value)))}</td>
  </tr>`;
}

function monthlySalesReportFileName(report: MonthlySalesReportResponse, extension: string) {
  return `monthly-sales-report-${report.dateFrom}-to-${report.dateTo}.${extension}`;
}

function formatExportNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
