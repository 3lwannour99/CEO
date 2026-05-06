import styles from "./DashboardCard.module.css";

interface DashboardCardProps {
  label: string;
  value: string;
  trend: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

export function DashboardCard({ label, value, trend, tone = "neutral" }: DashboardCardProps) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        <strong className={styles.value}>{value}</strong>
        <span className={styles.pulse} />
      </div>
      <p className={styles.trend}>{trend}</p>
    </article>
  );
}
