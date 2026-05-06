"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { LoadingScreen } from "@/components/LoadingScreen/LoadingScreen";
import { RefreshIndicator } from "@/components/RefreshIndicator/RefreshIndicator";
import { Topbar } from "@/components/Topbar/Topbar";
import { useInventoryData } from "@/hooks/useInventoryData";
import styles from "./DashboardShell.module.css";

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isInitialLoading, isBusy } = useInventoryData();

  return (
    <div className={styles.shell} data-busy={isBusy ? "true" : "false"}>
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isBusy={isBusy} />
      <div className={styles.contentArea}>
        <Topbar onMenuClick={() => !isBusy && setIsSidebarOpen(true)} />
        <RefreshIndicator />
        <main className={styles.main}>{isInitialLoading ? <LoadingScreen /> : children}</main>
      </div>
    </div>
  );
}
