import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { DashboardShell } from "@/components/DashboardShell/DashboardShell";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { CurrencyDisplayProvider } from "@/providers/CurrencyDisplayProvider/CurrencyDisplayProvider";
import { FilterProvider } from "@/providers/FilterProvider/FilterProvider";
import { InventoryDataProvider } from "@/providers/InventoryDataProvider/InventoryDataProvider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
      <body className={`${inter.variable} ${cairo.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <InventoryDataProvider>
              <CurrencyDisplayProvider>
                <FilterProvider>
                  <DashboardShell>{children}</DashboardShell>
                </FilterProvider>
              </CurrencyDisplayProvider>
            </InventoryDataProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
