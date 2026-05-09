type ExportRow = object;

export function exportCsv(filename: string, rows: ExportRow[]) {
  const csv = toCsv(rows);
  downloadBlob(filename.endsWith(".csv") ? filename : `${filename}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export function exportExcel(filename: string, rows: ExportRow[]) {
  const table = `<table>${rowsToHtml(rows)}</table>`;
  downloadBlob(filename.endsWith(".xls") ? filename : `${filename}.xls`, new Blob([table], { type: "application/vnd.ms-excel;charset=utf-8" }));
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
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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
