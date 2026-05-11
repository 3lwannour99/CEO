export const chartColors = {
  inStock: "var(--chart-in-stock)",
  sold: "var(--chart-sold)",
  reserve: "var(--chart-reserve)",
  reservationForCompanies: "var(--chart-company-reserve)",
  contract: "var(--chart-contract)",
  cession: "var(--chart-cession)",
  fast: "var(--chart-fast)",
  medium: "var(--chart-medium)",
  slow: "var(--chart-slow)",
  unknown: "var(--chart-unknown)",
  critical: "var(--chart-critical)",
  warning: "var(--chart-warning)",
  info: "var(--chart-info)",
  success: "var(--chart-success)",
  neutral: "var(--chart-neutral)",
  accent: "var(--chart-accent)",
};

export const chartPalette = [
  "var(--chart-accent)",
  "var(--chart-info)",
  "var(--chart-success)",
  "var(--chart-warning)",
  "var(--chart-critical)",
  "var(--chart-sold)",
  "var(--chart-reserve)",
  "var(--chart-contract)",
  "var(--chart-cession)",
  "var(--chart-neutral)",
];

export function chartColorForKey(key: string, index = 0) {
  const normalized = key.toLowerCase().replace(/[\s_-]+/g, "");

  if (normalized.includes("instock") || normalized.includes("available")) return chartColors.inStock;
  if (normalized.includes("sold")) return chartColors.sold;
  if (normalized.includes("reservationforcompanies") || normalized.includes("company")) return chartColors.reservationForCompanies;
  if (normalized.includes("reserve") || normalized.includes("reserved")) return chartColors.reserve;
  if (normalized.includes("contract")) return chartColors.contract;
  if (normalized.includes("cession")) return chartColors.cession;
  if (normalized.includes("fast")) return chartColors.fast;
  if (normalized.includes("medium")) return chartColors.medium;
  if (normalized.includes("slow")) return chartColors.slow;
  if (normalized.includes("critical") || normalized.includes("danger") || normalized.includes("high")) return chartColors.critical;
  if (normalized.includes("warning") || normalized.includes("overstock")) return chartColors.warning;
  if (normalized.includes("healthy") || normalized.includes("success")) return chartColors.success;
  if (normalized.includes("info")) return chartColors.info;

  return chartPalette[index % chartPalette.length];
}
