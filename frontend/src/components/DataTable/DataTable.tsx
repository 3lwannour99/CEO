import { formatValue } from "@/lib/apiClient";
import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  maxVisibleRows?: number;
  enableInternalScroll?: boolean;
  stickyHeader?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  maxVisibleRows = 15,
  enableInternalScroll = true,
  stickyHeader = true,
  isLoading = false,
  emptyMessage,
}: DataTableProps<T>) {
  const shouldScroll = enableInternalScroll && rows.length > maxVisibleRows;
  const wrapClassName = [
    styles.tableWrap,
    shouldScroll ? styles.scrollArea : "",
    stickyHeader ? styles.stickyHeader : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClassName} data-max-rows={maxVisibleRows}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
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
          ) : rows.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {emptyMessage ?? formatValue(null)}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row) ?? formatValue(null)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
