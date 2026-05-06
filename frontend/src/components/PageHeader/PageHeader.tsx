"use client";

import { useI18n } from "@/i18n/useI18n";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  description: string;
  meta?: string;
}

export function PageHeader({ title, description, meta }: PageHeaderProps) {
  const { t } = useI18n();

  return (
    <div className={styles.header}>
      <div>
        <p className={styles.kicker}>{t("app.kicker")}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
    </div>
  );
}
