"use client";

import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { useI18n } from "@/i18n/useI18n";
import styles from "./Topbar.module.css";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { language, t } = useI18n();
  const currentDate = new Intl.DateTimeFormat(language, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} type="button" onClick={onMenuClick} aria-label={t("app.openNavigation")}>
        <span />
        <span />
        <span />
      </button>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true" />
        <input className={styles.search} type="search" placeholder={t("topbar.searchPlaceholder")} />
      </div>
      <div className={styles.actions}>
        <span className={styles.date}>{currentDate}</span>
        <button className={styles.iconButton} type="button" aria-label={t("app.notifications")} title={t("app.notifications")}>
          3
        </button>
        <LanguageToggle />
        <ThemeToggle />
        <div className={styles.company}>
          <span className={styles.avatar}>CR</span>
          <span className={styles.companyText}>{t("app.companyAdmin")}</span>
        </div>
      </div>
    </header>
  );
}
