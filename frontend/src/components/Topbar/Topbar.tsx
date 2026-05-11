"use client";

import { LanguageToggle } from "@/components/LanguageToggle/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { CurrencySelector } from "@/components/CurrencySelector/CurrencySelector";
import { CountrySelector } from "@/components/CountrySelector/CountrySelector";
import { useI18n } from "@/i18n/useI18n";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { formatDate } from "@/lib/apiClient";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import styles from "./Topbar.module.css";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useI18n();
  const auth = useAuth();
  const { filters, setFilters } = useGlobalFilters();
  const inventoryData = useInventoryData();
  const { refreshData, isInitialLoading, isRefreshing, isBusy } = inventoryData;
  const alertCount = inventoryData.getAlerts(filters).length;
  const currentDate = formatDate(new Date());
  const isLiveMode = inventoryData.meta?.dataMode === "live";

  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} type="button" onClick={onMenuClick} aria-label={t("app.openNavigation")} disabled={isBusy}>
        <span />
        <span />
        <span />
      </button>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true" />
        <input
          className={styles.search}
          type="search"
          placeholder={t("topbar.searchPlaceholder")}
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
      </div>
      <div className={styles.actions}>
        <div className={styles.statusGroup}>
          <span className={styles.date}>{currentDate}</span>
          <button className={styles.alertButton} type="button" aria-label={t("app.notifications")} title={t("app.notifications")} disabled={isBusy}>
            {alertCount}
          </button>
          {auth.hasPermission("inventory.sync") && !isLiveMode ? (
            <button className={styles.refreshButton} type="button" onClick={() => void refreshData("manual-refresh")} disabled={isInitialLoading || isRefreshing}>
              {isRefreshing ? t("filters.refreshingData") : t("summary.refresh")}
            </button>
          ) : null}
        </div>
        <div className={styles.controlGroup}>
          <LanguageToggle />
          <CountrySelector />
          <CurrencySelector />
          <ThemeToggle />
        </div>
        <div className={styles.userMenu}>
          <span className={styles.avatar}>CR</span>
          <span className={styles.userName}>{auth.user?.fullName ?? t("app.companyAdmin")}</span>
          <button className={styles.logoutButton} type="button" onClick={() => void auth.logout()} aria-label={t("auth.logout")} title={t("auth.logout")}>
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
