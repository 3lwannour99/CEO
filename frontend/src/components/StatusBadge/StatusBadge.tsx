"use client";

import type { AlertSeverity, InventoryStatus } from "@/types/inventory";
import { useI18n } from "@/i18n/useI18n";
import styles from "./StatusBadge.module.css";

type BadgeTone = InventoryStatus | AlertSeverity | "fast" | "medium" | "slow" | "unknown" | "neutral";

interface StatusBadgeProps {
  tone: BadgeTone | string;
  children?: React.ReactNode;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  const className = styles[tone.replace("-", "") as keyof typeof styles] ?? styles.neutral;
  const { t } = useI18n();
  const labelKey = `status.${tone.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;

  return <span className={`${styles.badge} ${className}`}>{children ?? t(labelKey)}</span>;
}
