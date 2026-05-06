"use client";

import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useAppBusy } from "@/hooks/useAppBusy";
import { useI18n } from "@/i18n/useI18n";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isBusy = useAppBusy();
  const label = theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark");

  return (
    <button className={styles.toggle} type="button" onClick={toggleTheme} aria-label={label} title={label} disabled={isBusy}>
      <span className={styles.indicator} />
      <span className={styles.text}>{theme === "dark" ? t("theme.dark") : t("theme.light")}</span>
    </button>
  );
}
