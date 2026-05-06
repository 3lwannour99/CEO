"use client";

import { languages } from "@/i18n/locales";
import { useAppBusy } from "@/hooks/useAppBusy";
import { useI18n } from "@/i18n/useI18n";
import styles from "./LanguageToggle.module.css";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();
  const isBusy = useAppBusy();

  return (
    <div className={styles.group} aria-label={t("language.switch")}>
      {Object.values(languages).map((item) => (
        <button
          className={`${styles.option} ${language === item.code ? styles.active : ""}`}
          type="button"
          key={item.code}
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
          title={item.label}
          disabled={isBusy}
        >
          {item.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
