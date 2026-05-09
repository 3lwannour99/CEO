"use client";

import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { CurrencySelector } from "@/components/CurrencySelector/CurrencySelector";
import { useI18n } from "@/i18n/useI18n";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { formatDate } from "@/lib/apiClient";
import styles from "./Topbar.module.css";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useI18n();
  const { filters } = useGlobalFilters();
  const inventoryData = useInventoryData();
  const { refreshData, isInitialLoading, isRefreshing, isBusy } = inventoryData;
  const alertCount = inventoryData.getAlerts(filters).length;
  const currentDate = formatDate(new Date());

  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} type="button" onClick={onMenuClick} aria-label={t("app.openNavigation")} disabled={isBusy}>
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
        <button className={styles.iconButton} type="button" aria-label={t("app.notifications")} title={t("app.notifications")} disabled={isBusy}>
          {alertCount}
        </button>
        <button className={styles.refreshButton} type="button" onClick={() => void refreshData("manual-refresh")} disabled={isInitialLoading || isRefreshing}>
          {isRefreshing ? t("filters.refreshingData") : t("summary.refresh")}
        </button>
        <LanguageToggle />
        <CurrencySelector />
        <ThemeToggle />
        <div className={styles.company}>
          <span className={styles.avatar}>CR</span>
          <span className={styles.companyText}>{t("app.companyAdmin")}</span>
        </div>
      </div>
    </header>
  );
}
