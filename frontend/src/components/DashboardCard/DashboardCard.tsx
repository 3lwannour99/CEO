import styles from "./DashboardCard.module.css";

interface DashboardCardProps {
  label: string;
  value: string;
  trend: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "green" | "yellow" | "blue" | "purple" | "red" | "pink";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
  disabled?: boolean;
  ariaPressed?: boolean;
}

export function DashboardCard({ label, value, trend, tone = "neutral", onClick, isActive = false, disabled = false, ariaPressed }: DashboardCardProps) {
  const className = `${styles.card} ${styles[tone]} ${onClick ? styles.clickable : ""} ${isActive ? styles.active : ""}`;

  const content = (
    <>
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        <strong className={styles.value}>{value}</strong>
        <span className={styles.pulse} />
      </div>
      <p className={styles.trend}>{trend}</p>
    </>
  );

  if (onClick) {
    return (
      <button className={className} type="button" onClick={onClick} disabled={disabled} aria-pressed={ariaPressed ?? isActive}>
        {content}
      </button>
    );
  }

  return (
    <article className={className}>
      {content}
    </article>
  );
}
