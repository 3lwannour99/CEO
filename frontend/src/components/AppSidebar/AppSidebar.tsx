"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/useI18n";
import styles from "./AppSidebar.module.css";

const navItems = [
  { labelKey: "sidebar.dashboard", href: "/dashboard", marker: "DB" },
  { labelKey: "sidebar.inventoryMovement", href: "/inventory-movement", marker: "IM" },
  { labelKey: "sidebar.alerts", href: "/alerts", marker: "AL" },
  { labelKey: "sidebar.replenishment", href: "/replenishment", marker: "RP" },
  { labelKey: "sidebar.stockCoverage", href: "/stock-coverage", marker: "SC" },
  { labelKey: "sidebar.salesPerformance", href: "/sales-performance", marker: "SP" },
  { labelKey: "sidebar.salesmenKpi", href: "/salesmen-kpi", marker: "SK" },
  { labelKey: "sidebar.aggregatedStock", href: "/aggregated-stock", marker: "AS" },
  { labelKey: "sidebar.logistics", href: "/logistics", marker: "LG" },
  { labelKey: "sidebar.multiLocation", href: "/multi-location", marker: "ML" },
  { labelKey: "sidebar.settings", href: "/settings", marker: "ST" },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isBusy?: boolean;
}

export function AppSidebar({ isOpen, onClose, isBusy = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

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
          {navItems.map((item) => {
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
