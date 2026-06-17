"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { LoadingScreen } from "@/components/LoadingScreen/LoadingScreen";
import { RefreshIndicator } from "@/components/RefreshIndicator/RefreshIndicator";
import { Topbar } from "@/components/Topbar/Topbar";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import styles from "./DashboardShell.module.css";

const routePermissions: Array<{ prefix: string; permissions: string[] }> = [
  { prefix: "/dashboard", permissions: ["dashboard.page.view"] },
  { prefix: "/inventory-movement", permissions: ["inventory.page.view"] },
  { prefix: "/alerts", permissions: ["alerts.page.view"] },
  { prefix: "/replenishment", permissions: ["replenishment.page.view"] },
  { prefix: "/stock-coverage", permissions: ["stockCoverage.page.view"] },
  { prefix: "/sales-performance", permissions: ["salesPerformance.page.view"] },
  { prefix: "/salesmen-kpi", permissions: ["salesPerformance.page.view"] },
  { prefix: "/aggregated-stock", permissions: ["inventory.page.view"] },
  { prefix: "/stock-rules", permissions: ["stockRules.page.view"] },
  { prefix: "/snapshots", permissions: ["snapshots.page.view"] },
  { prefix: "/logistics", permissions: ["logistics.page.view"] },
  { prefix: "/multi-location", permissions: ["multiLocation.page.view"] },
  { prefix: "/multi-status-chassis", permissions: ["inventory.page.view"] },
  { prefix: "/settings", permissions: ["settings.view"] },
  { prefix: "/roles", permissions: ["roles.view", "roles.manage"] },
  { prefix: "/users", permissions: ["users.view", "users.manage"] },
  { prefix: "/monthly-sales-targets", permissions: ["monthlySalesTargets.page.view"] },
];

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { isInitialLoading, isBusy } = useInventoryData();
  const isLoginRoute = pathname === "/login";
  const isPublicRoute = pathname === "/dashboard/monthly-sales-report";
  const requiredPermissions = routePermissions.find((route) => pathname.startsWith(route.prefix))?.permissions ?? [];
  const canViewRoute = auth.hasAnyPermission(requiredPermissions);

  useEffect(() => {
    if (!isLoginRoute && !isPublicRoute && !auth.isLoading && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isAuthenticated, auth.isLoading, isLoginRoute, isPublicRoute, router]);

  if (isLoginRoute || isPublicRoute) {
    return <>{children}</>;
  }

  if (auth.isLoading) {
    return <LoadingScreen />;
  }

  if (!auth.isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.shell} data-busy={isBusy ? "true" : "false"}>
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isBusy={isBusy} />
      <div className={styles.contentArea}>
        <Topbar onMenuClick={() => !isBusy && setIsSidebarOpen(true)} />
        <RefreshIndicator />
        <main className={styles.main}>
          {isInitialLoading ? <LoadingScreen /> : canViewRoute ? children : <AccessDenied />}
        </main>
      </div>
    </div>
  );
}

function AccessDenied() {
  const { t } = useI18n();

  return (
    <section className={styles.accessDenied}>
      <h1>{t("auth.accessDeniedTitle")}</h1>
      <p>{t("auth.accessDeniedMessage")}</p>
    </section>
  );
}
