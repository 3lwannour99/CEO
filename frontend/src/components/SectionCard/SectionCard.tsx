import styles from "./SectionCard.module.css";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  action?: string;
  scrollable?: boolean;
  maxHeight?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, eyebrow, action, scrollable = false, maxHeight, children }: SectionCardProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.title}>{title}</h2>
        </div>
        {action ? <span className={styles.action}>{action}</span> : null}
      </div>
      <div className={`${styles.body} ${scrollable ? styles.scrollableBody : ""}`} style={maxHeight ? { maxHeight } : undefined}>
        {children}
      </div>
    </section>
  );
}
