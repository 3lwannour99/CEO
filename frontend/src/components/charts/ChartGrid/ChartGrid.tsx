import styles from "./ChartGrid.module.css";

export function ChartGrid({ children }: Readonly<{ children: React.ReactNode }>) {
  return <section className={styles.grid}>{children}</section>;
}
