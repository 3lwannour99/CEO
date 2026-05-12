import * as XLSX from "xlsx";

type ExportRow = object;

export interface ExcelExportColumn<T> {
  key: string;
  header: string;
  value?: (row: T) => unknown;
}

interface ExcelExportOptions<T> {
  rows: T[];
  columns: ExcelExportColumn<T>[];
  fileName?: string;
  sheetName?: string;
  title?: string;
  language?: string;
  direction?: "ltr" | "rtl";
}

export function exportCsv(filename: string, rows: ExportRow[]) {
  const csv = toCsv(rows);
  downloadBlob(filename.endsWith(".csv") ? filename : `${filename}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export function exportExcel(filename: string, rows: ExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows.map(flattenRow));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, normalizeExcelFilename(filename));
}

export function exportToExcel<T>({
  rows,
  columns,
  fileName,
  sheetName,
  title,
}: ExcelExportOptions<T>) {
  const exportRows = rows.map((row) =>
    Object.fromEntries(
      columns.map((column) => [
        cleanExportText(column.header || column.key),
        exportValue(resolveColumnValue(row, column)),
      ]),
    ),
  );
  const worksheet = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [emptyRow(columns)]);
  const workbook = XLSX.utils.book_new();

  if (title) {
    worksheet["!cols"] = columns.map(() => ({ wch: 20 }));
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName || title || "Data"));
  XLSX.writeFile(workbook, normalizeExcelFilename(sanitizeFileName(fileName || title || "table-export")));
}

function toCsv(rows: ExportRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0] ?? {});
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(",")),
  ].join("\n");
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : cleanExportText(String(value));
  return `"${text.replace(/"/g, '""')}"`;
}

function normalizeExcelFilename(filename: string) {
  return filename.replace(/\.xls$/i, ".xlsx").replace(/(\.xlsx)?$/i, ".xlsx");
}

export function defaultExcelFileName(title?: string) {
  return `${sanitizeFileName(title || "table-export")}-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

function flattenRow(row: ExportRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, exportValue(value)]),
  );
}

function exportValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return typeof value === "string" ? cleanExportText(value) : value;
  }

  if (isMoneyTotals(value)) {
    return [
      value.original !== undefined ? `${value.original} Original` : "",
      value.sar !== undefined ? `${value.sar} SAR` : "",
      value.jod !== undefined ? `${value.jod} JOD` : "",
      value.usd !== undefined ? `${value.usd} USD` : "",
    ].filter(Boolean).join(" | ");
  }

  return cleanExportText(JSON.stringify(value));
}

function cleanExportText(value: string) {
  return value
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s*Â·\s*/g, " · ")
    .trim();
}

function resolveColumnValue<T>(row: T, column: ExcelExportColumn<T>) {
  if (column.value) {
    return column.value(row);
  }

  if (row && typeof row === "object" && column.key in row) {
    return (row as Record<string, unknown>)[column.key];
  }

  return undefined;
}

function emptyRow<T>(columns: ExcelExportColumn<T>[]) {
  return Object.fromEntries(columns.map((column) => [cleanExportText(column.header || column.key), "-"]));
}

function sanitizeFileName(value: string) {
  return cleanExportText(value)
    .replace(/\.(xlsx|xls)$/i, "")
    .toLowerCase()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "table-export";
}

function sanitizeSheetName(value: string) {
  const cleaned = cleanExportText(value).replace(/[\[\]:*?/\\]/g, " ").trim();
  return (cleaned || "Data").slice(0, 31);
}

function isMoneyTotals(value: unknown): value is { original?: number; sar?: number; jod?: number; usd?: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("sar" in value || "jod" in value || "usd" in value || "original" in value),
  );
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
