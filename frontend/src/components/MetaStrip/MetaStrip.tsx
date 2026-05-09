"use client";

import { useState } from "react";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import { formatDate } from "@/lib/apiClient";
import type { ApiMeta } from "@/types/inventory";
import styles from "./MetaStrip.module.css";

interface MetaStripProps {
  meta?: ApiMeta;
}

export function MetaStrip({ meta }: MetaStripProps) {
  const { t } = useI18n();
  const { liveStatus } = useInventoryData();
  const [now] = useState(() => Date.now());

  if (!meta) {
    return null;
  }

  const lastSyncedAt = meta.lastSyncedAt ?? meta.generatedAt;
  const isStale = now - new Date(lastSyncedAt).getTime() > 5 * 60 * 1000;

  return (
    <div className={styles.meta}>
      <span>{meta.fromDatabase ? t("summary.fromDatabase") : t("summary.liveData")}</span>
      <span>{t("summary.lastUpdated")}: {formatDate(meta.generatedAt)}</span>
      <span>{t("summary.lastSynced")}: {formatDate(lastSyncedAt)}</span>
      <span>{t("summary.fromCache")}: {meta.fromCache ? t("summary.yes") : t("summary.no")}</span>
      {meta.syncStatus ? <span>{t("summary.syncStatus")}: {meta.syncStatus}</span> : null}
      <span className={liveStatus.connected ? styles.liveConnected : styles.liveDisconnected}>
        Live: {liveStatus.connected ? "connected" : "disconnected"}
      </span>
      {liveStatus.lastEvent ? <span>Latest sync: {liveStatus.lastEvent.status}</span> : null}
      {liveStatus.lastUpdatedAt ? <span>Socket update: {formatDate(liveStatus.lastUpdatedAt)}</span> : null}
      {liveStatus.lastEvent?.failedSources ? <span>Failed sources: {liveStatus.lastEvent.failedSources}</span> : null}
      {liveStatus.connectionError ? <span>Socket: {liveStatus.connectionError}</span> : null}
      {isStale ? <span>{t("summary.staleData")}</span> : null}
      <span>{t("summary.successfulSources")}: {meta.successfulSources}</span>
      <span>{t("summary.failedSources")}: {meta.failedSources}</span>
    </div>
  );
}
