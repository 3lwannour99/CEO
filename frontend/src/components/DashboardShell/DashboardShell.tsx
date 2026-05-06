"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { Topbar } from "@/components/Topbar/Topbar";
import styles from "./DashboardShell.module.css";

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={styles.contentArea}>
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
