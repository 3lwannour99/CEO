import * as XLSX from "xlsx";

type ExportRow = object;

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

export function exportPdf(filename: string, rows: ExportRow[]) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    exportCsv(filename.replace(/\.pdf$/i, ".csv"), rows);
    return;
  }

  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(filename)}</title><style>body{font-family:Arial,sans-serif;margin:24px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f1f3f5}</style></head><body><h1>${escapeHtml(filename)}</h1><table>${rowsToHtml(rows)}</table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
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

function flattenRow(row: ExportRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, exportValue(value)]),
  );
}

function exportValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return typeof value === "string" ? cleanExportText(value) : value;
  }

  return cleanExportText(JSON.stringify(value));
}

function cleanExportText(value: string) {
  return value
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s*Â·\s*/g, " · ")
    .trim();
}

function rowsToHtml(rows: ExportRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  return `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml((row as Record<string, unknown>)[header])}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
