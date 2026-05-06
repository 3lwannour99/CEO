import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell/DashboardShell";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { FilterProvider } from "@/providers/FilterProvider/FilterProvider";
import { InventoryDataProvider } from "@/providers/InventoryDataProvider/InventoryDataProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Stock Dashboard",
  description: "Professional inventory and stock management dashboard base system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <InventoryDataProvider>
              <FilterProvider>
                <DashboardShell>{children}</DashboardShell>
              </FilterProvider>
            </InventoryDataProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
