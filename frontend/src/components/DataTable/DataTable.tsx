"use client";

import { useEffect, useMemo, useState } from "react";
import { formatValue } from "@/lib/apiClient";
import { defaultExcelFileName, exportToExcel, type ExcelExportColumn } from "@/lib/exportData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useI18n } from "@/i18n/useI18n";
import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  searchValue?: (row: T) => unknown;
  sortValue?: (row: T) => unknown;
  exportValue?: (row: T) => unknown;
  exportable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  maxVisibleRows?: number;
  enableInternalScroll?: boolean;
  stickyHeader?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  enableColumnSearch?: boolean;
  columnFilters?: Record<string, string>;
  onColumnFiltersChange?: (filters: Record<string, string>) => void;
  searchableColumns?: string[];
  nonSearchableColumns?: string[];
  enableSorting?: boolean;
  sortableColumns?: string[];
  nonSortableColumns?: string[];
  enablePagination?: boolean;
  pageSize?: number;
  getRowKey?: (row: T, rowIndex: number) => React.Key;
  exportEnabled?: boolean;
  exportFileName?: string;
  exportSheetName?: string;
  exportTitle?: string;
  exportRows?: T[];
  exportColumns?: ExcelExportColumn<T>[];
  exportIncludeHiddenColumns?: boolean;
  exportUseFilteredRows?: boolean;
}

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

function normalizeSearchValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function getObjectValue(row: unknown, key: string) {
  if (row && typeof row === "object" && key in row) {
    return (row as Record<string, unknown>)[key];
  }

  return undefined;
}

function normalizeSortValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed.replace(/,/g, ""));

    return trimmed && Number.isFinite(numeric) ? numeric : trimmed.toLowerCase();
  }

  return "";
}

function compareSortValues(left: unknown, right: unknown) {
  const normalizedLeft = normalizeSortValue(left);
  const normalizedRight = normalizeSortValue(right);

  if (typeof normalizedLeft === "number" && typeof normalizedRight === "number") {
    return normalizedLeft - normalizedRight;
  }

  return String(normalizedLeft).localeCompare(String(normalizedRight), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function DataTable<T>({
  columns,
  rows,
  maxVisibleRows = 15,
  enableInternalScroll = true,
  stickyHeader = true,
  isLoading = false,
  emptyMessage,
  enableColumnSearch = true,
  columnFilters,
  onColumnFiltersChange,
  searchableColumns,
  nonSearchableColumns,
  enableSorting = true,
  sortableColumns,
  nonSortableColumns,
  enablePagination = true,
  pageSize = 100,
  getRowKey,
  exportEnabled = true,
  exportFileName,
  exportSheetName,
  exportTitle,
  exportRows,
  exportColumns,
  exportIncludeHiddenColumns = false,
  exportUseFilteredRows = true,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const [columnFilterDrafts, setColumnFilterDrafts] = useState<Record<string, string>>(columnFilters ?? {});
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedColumnFilters = useDebouncedValue(columnFilterDrafts, 250);
  const activeColumnFilters = columnFilters ?? debouncedColumnFilters;
  const searchableColumnSet = searchableColumns ? new Set(searchableColumns) : null;
  const nonSearchableColumnSet = new Set(nonSearchableColumns ?? []);
  const sortableColumnSet = sortableColumns ? new Set(sortableColumns) : null;
  const nonSortableColumnSet = new Set(nonSortableColumns ?? []);
  const visibleRows = useMemo(() => {
    const filteredRows = rows.filter((row) =>
        columns.every((column) => {
          const filterValue = activeColumnFilters[column.key]?.trim().toLowerCase();

          if (!filterValue) {
            return true;
          }

          const rendered = column.searchValue ? column.searchValue(row) : column.render(row);
          return normalizeSearchValue(rendered).toLowerCase().includes(filterValue);
        }),
      );

    if (!sortState) {
      return filteredRows;
    }

    const sortColumn = columns.find((column) => column.key === sortState.key);

    if (!sortColumn) {
      return filteredRows;
    }

    return [...filteredRows].sort((leftRow, rightRow) => {
      const leftValue = sortColumn.sortValue
        ? sortColumn.sortValue(leftRow)
        : sortColumn.searchValue
          ? sortColumn.searchValue(leftRow)
          : getObjectValue(leftRow, sortColumn.key) ?? sortColumn.render(leftRow);
      const rightValue = sortColumn.sortValue
        ? sortColumn.sortValue(rightRow)
        : sortColumn.searchValue
          ? sortColumn.searchValue(rightRow)
          : getObjectValue(rightRow, sortColumn.key) ?? sortColumn.render(rightRow);
      const result = compareSortValues(leftValue, rightValue);

      return sortState.direction === "asc" ? result : -result;
    });
  }, [activeColumnFilters, columns, rows, sortState]);
  const pageCount = enablePagination ? Math.max(1, Math.ceil(visibleRows.length / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const renderedRows = enablePagination ? visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : visibleRows;
  const shouldScroll = enableInternalScroll && visibleRows.length > maxVisibleRows;
  const hasColumnFilters = Object.values(activeColumnFilters).some((value) => value.trim());
  const rowsForExport = exportRows ?? (exportUseFilteredRows ? visibleRows : rows);
  const columnsForExport = exportColumns ?? columns.filter((column) => exportIncludeHiddenColumns || (column.exportable !== false && !isActionColumn(column)));
  const canExport = exportEnabled && !isLoading && rowsForExport.length > 0 && columnsForExport.length > 0;
  const wrapClassName = [
    styles.tableWrap,
    shouldScroll ? styles.scrollArea : "",
    stickyHeader ? styles.stickyHeader : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(debouncedColumnFilters);
    }
  }, [debouncedColumnFilters, onColumnFiltersChange]);

  function columnIsSearchable(column: DataTableColumn<T>) {
    return enableColumnSearch && (searchableColumnSet ? searchableColumnSet.has(column.key) : !nonSearchableColumnSet.has(column.key));
  }

  function columnIsSortable(column: DataTableColumn<T>) {
    return enableSorting && (sortableColumnSet ? sortableColumnSet.has(column.key) : !nonSortableColumnSet.has(column.key));
  }

  function updateSort(column: DataTableColumn<T>) {
    if (!columnIsSortable(column)) {
      return;
    }

    setSortState((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      return { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
    setPage(1);
  }

  function updateColumnFilter(key: string, value: string) {
    const nextFilters = { ...columnFilterDrafts, [key]: value };

    if (!value) {
      delete nextFilters[key];
    }

    setColumnFilterDrafts(nextFilters);
    setPage(1);
  }

  function clearColumnFilters() {
    setColumnFilterDrafts({});
    setPage(1);

    if (onColumnFiltersChange) {
      onColumnFiltersChange({});
    }
  }

  function handleExportExcel() {
    if (!canExport || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      exportToExcel({
        columns: columnsForExport.map((column) => ({
          header: column.header,
          key: column.key,
          value: "value" in column
            ? column.value
            : (row: T) => getExportValue(row, column as DataTableColumn<T>),
        })),
        fileName: exportFileName ?? defaultExcelFileName(exportTitle ?? exportSheetName),
        rows: rowsForExport,
        sheetName: exportSheetName ?? exportTitle,
        title: exportTitle,
      });
    } catch (error) {
      console.error(t("table.exportFailed"), error);
    } finally {
      setIsExporting(false);
    }
  }

  function resolveRowKey(row: T, rowIndex: number) {
    if (getRowKey) {
      return getRowKey(row, rowIndex);
    }

    if (row && typeof row === "object") {
      const value = (row as Record<string, unknown>).inventoryKey ?? (row as Record<string, unknown>).id;

      if (typeof value === "string" || typeof value === "number") {
        return value;
      }
    }

    return rowIndex;
  }

  return (
    <div className={styles.tableFrame}>
      {(exportEnabled || (enableColumnSearch && hasColumnFilters)) ? (
        <div className={styles.tableTools}>
          <div className={styles.tableToolGroup}>
            {enableColumnSearch && hasColumnFilters ? (
              <button type="button" className={styles.clearFiltersButton} onClick={clearColumnFilters}>
                {t("table.clearColumnFilters")}
              </button>
            ) : null}
          </div>
          <div className={styles.tableToolGroup}>
            {exportEnabled ? (
              <button
                type="button"
                className={styles.exportButton}
                onClick={handleExportExcel}
                disabled={!canExport || isExporting}
                title={rowsForExport.length === 0 ? t("table.noRowsToExport") : t("table.exportCurrentFilteredRows")}
              >
                {isExporting ? t("table.exporting") : t("table.exportExcel")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={wrapClassName} data-max-rows={maxVisibleRows}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => {
              const isSortable = columnIsSortable(column);
              const isSorted = sortState?.key === column.key;

              return (
                <th key={column.key} aria-sort={isSorted ? (sortState.direction === "asc" ? "ascending" : "descending") : "none"}>
                  {isSortable ? (
                    <button className={styles.sortButton} type="button" onClick={() => updateSort(column)}>
                      <span>{column.header}</span>
                      <span className={`${styles.sortIcon} ${isSorted ? styles.sorted : ""}`} aria-hidden="true">
                        {isSorted ? (sortState.direction === "asc" ? "\u2191" : "\u2193") : "\u2195"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
          {enableColumnSearch ? (
            <tr className={styles.searchRow}>
              {columns.map((column) => (
                <th key={column.key}>
                  {columnIsSearchable(column) ? (
                    <input
                      className={styles.columnSearch}
                      value={columnFilterDrafts[column.key] ?? ""}
                      onChange={(event) => updateColumnFilter(column.key, event.target.value)}
                      placeholder={t("table.searchColumn")}
                      aria-label={`${t("table.searchColumn")}: ${column.header}`}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: Math.min(maxVisibleRows, 6) }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key}>
                    <span className={styles.skeletonCell} />
                  </td>
                ))}
              </tr>
            ))
          ) : visibleRows.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {emptyMessage ?? formatValue(null)}
              </td>
            </tr>
          ) : (
            renderedRows.map((row, rowIndex) => (
              <tr key={resolveRowKey(row, rowIndex)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row) ?? formatValue(null)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      {enablePagination && visibleRows.length > pageSize ? (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {formatValue((currentPage - 1) * pageSize + 1)}-{formatValue(Math.min(currentPage * pageSize, visibleRows.length))} / {formatValue(visibleRows.length)}
          </span>
          <div className={styles.pageActions}>
            <button className={styles.pageButton} type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
              {t("table.previousPage")}
            </button>
            <button className={styles.pageButton} type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>
              {t("table.nextPage")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isActionColumn<T>(column: DataTableColumn<T>) {
  return ["action", "actions", "details", "vehicles"].includes(column.key.toLowerCase());
}

function getExportValue<T>(row: T, column: DataTableColumn<T>) {
  if (column.exportValue) {
    return column.exportValue(row);
  }

  if (column.searchValue) {
    return column.searchValue(row);
  }

  const objectValue = getObjectValue(row, column.key);
  if (objectValue !== undefined) {
    return objectValue;
  }

  const rendered = column.render(row);
  if (typeof rendered === "string" || typeof rendered === "number" || typeof rendered === "boolean") {
    return rendered;
  }

  return undefined;
}
