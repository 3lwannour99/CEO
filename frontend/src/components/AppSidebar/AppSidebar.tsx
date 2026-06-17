"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import styles from "./AppSidebar.module.css";

const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", marker: "DB", permissions: ["dashboard.page.view"] },
  { labelKey: "nav.inventoryMovement", href: "/inventory-movement", marker: "IM", permissions: ["inventory.page.view"] },
  { labelKey: "nav.alerts", href: "/alerts", marker: "AL", permissions: ["alerts.page.view"] },
  { labelKey: "nav.replenishment", href: "/replenishment", marker: "RP", permissions: ["replenishment.page.view"] },
  { labelKey: "nav.stockCoverage", href: "/stock-coverage", marker: "SC", permissions: ["stockCoverage.page.view"] },
  { labelKey: "nav.salesPerformance", href: "/sales-performance", marker: "SP", permissions: ["salesPerformance.page.view"] },
  { labelKey: "nav.salesmenKpi", href: "/salesmen-kpi", marker: "SK", permissions: ["salesPerformance.page.view"] },
  { labelKey: "nav.monthlySalesReport", href: "/dashboard/monthly-sales-report", marker: "MS", permissions: [] },
  { labelKey: "nav.aggregatedStock", href: "/aggregated-stock", marker: "AS", permissions: ["inventory.page.view"] },
  { labelKey: "nav.stockRules", href: "/stock-rules", marker: "SR", permissions: ["stockRules.page.view"] },
  { labelKey: "nav.dailySnapshots", href: "/snapshots", marker: "SN", permissions: ["snapshots.page.view"] },
  { labelKey: "nav.logistics", href: "/logistics", marker: "LG", permissions: ["logistics.page.view"] },
  { labelKey: "nav.multiLocation", href: "/multi-location", marker: "ML", permissions: ["multiLocation.page.view"] },
  { labelKey: "nav.multiStatusChassis", href: "/multi-status-chassis", marker: "MC", permissions: ["inventory.page.view"] },
  { labelKey: "nav.users", href: "/users", marker: "US", permissions: ["users.view", "users.manage"] },
  { labelKey: "nav.roles", href: "/roles", marker: "RO", permissions: ["roles.view", "roles.manage"] },
  { labelKey: "nav.settings", href: "/settings", marker: "ST", permissions: ["settings.view"] },
  { labelKey: "nav.monthlySalesTargets", href: "/monthly-sales-targets", marker: "MT", permissions: ["monthlySalesTargets.page.view"] },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isBusy?: boolean;
}

export function AppSidebar({ isOpen, onClose, isBusy = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const auth = useAuth();

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`} aria-label={t("app.primaryNavigation")}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>IS</span>
          <div>
            <p className={styles.brandName}>{t("app.inventorySuite")}</p>
            <p className={styles.brandMeta}>{t("app.stockControl")}</p>
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.filter((item) => auth.hasAnyPermission(item.permissions)).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                className={`${styles.navItem} ${active ? styles.active : ""}`}
                href={item.href}
                key={item.href}
                onClick={(event) => {
                  if (isBusy) {
                    event.preventDefault();
                    return;
                  }

                  onClose();
                }}
                aria-disabled={isBusy}
              >
                <span className={styles.marker}>{item.marker}</span>
                <span className={styles.label}>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <button
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
        type="button"
        aria-label={t("app.closeNavigation")}
        disabled={isBusy}
        onClick={onClose}
      />
    </>
  );
}
