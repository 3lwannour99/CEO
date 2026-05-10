"use client";

import { FormEvent, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { createStockRule, deleteStockRule, getStockRules } from "@/services/inventoryApi";
import { formatNumber, formatValue } from "@/lib/apiClient";
import { useI18n } from "@/i18n/useI18n";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import type { StockRule, StockRuleInput } from "@/types/inventory";

const emptyRule: StockRuleInput = {
  sourceId: null,
  brand: null,
  model: null,
  type: null,
  exteriorColor: null,
  warehouse: null,
  minStock: 1,
  maxStock: 10,
  reorderPoint: 2,
  targetCoverageMonths: 3,
  leadTimeDays: 30,
  supplierName: null,
  factoryName: null,
  isActive: true,
};

export default function StockRulesPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const [rules, setRules] = useState<StockRule[]>([]);
  const [draft, setDraft] = useState<StockRuleInput>(emptyRule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      setRules(await getStockRules());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "API error");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await createStockRule(draft);
      setDraft(emptyRule);
      await loadRules();
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<StockRule>[] = [
    { key: "model", header: t("table.model"), render: (row) => formatValue(row.model) },
    { key: "color", header: t("table.color"), render: (row) => formatValue(row.exteriorColor) },
    { key: "warehouse", header: t("table.warehouse"), render: (row) => formatValue(row.warehouse) },
    { key: "min", header: t("table.minStock"), render: (row) => formatNumber(row.minStock) },
    { key: "max", header: t("table.maxStock"), render: (row) => formatNumber(row.maxStock) },
    { key: "reorder", header: t("table.reorderPoint"), render: (row) => formatNumber(row.reorderPoint) },
    { key: "target", header: t("table.targetCoverageMonths"), render: (row) => formatNumber(row.targetCoverageMonths) },
    { key: "lead", header: t("table.leadTimeDays"), render: (row) => formatNumber(row.leadTimeDays) },
    { key: "active", header: t("table.active"), render: (row) => (row.isActive ? t("summary.yes") : t("summary.no")) },
    ...(auth.hasPermission("actions.editStockRules.execute")
      ? [{ key: "delete", header: "", render: (row: StockRule) => <button className="report-button" type="button" onClick={() => void deleteStockRule(row.id).then(loadRules)}>{t("actions.delete")}</button> }]
      : []),
  ];

  return (
    <>
      <PageHeader title={t("pages.stockRules.title")} description={t("pages.stockRules.description")} />
      {error ? <p>{error}</p> : null}
      {auth.hasPermission("actions.editStockRules.execute") ? (
        <SectionCard title={t("sidebar.stockRules")} eyebrow={t("sections.configuration")}>
          <form className="business-form" onSubmit={submit}>
          <TextField label={t("table.company")} value={draft.sourceId ?? ""} onChange={(value) => setDraft({ ...draft, sourceId: value || null })} />
          <TextField label={t("table.brand")} value={draft.brand ?? ""} onChange={(value) => setDraft({ ...draft, brand: value || null })} />
          <TextField label={t("table.model")} value={draft.model ?? ""} onChange={(value) => setDraft({ ...draft, model: value || null })} />
          <TextField label={t("table.type")} value={draft.type ?? ""} onChange={(value) => setDraft({ ...draft, type: value || null })} />
          <TextField label={t("table.color")} value={draft.exteriorColor ?? ""} onChange={(value) => setDraft({ ...draft, exteriorColor: value || null })} />
          <TextField label={t("table.warehouse")} value={draft.warehouse ?? ""} onChange={(value) => setDraft({ ...draft, warehouse: value || null })} />
          <NumberField label={t("table.minStock")} value={draft.minStock} onChange={(value) => setDraft({ ...draft, minStock: value })} />
          <NumberField label={t("table.maxStock")} value={draft.maxStock} onChange={(value) => setDraft({ ...draft, maxStock: value })} />
          <NumberField label={t("table.reorderPoint")} value={draft.reorderPoint} onChange={(value) => setDraft({ ...draft, reorderPoint: value })} />
          <NumberField label={t("table.targetCoverageMonths")} value={draft.targetCoverageMonths} onChange={(value) => setDraft({ ...draft, targetCoverageMonths: value })} />
          <NumberField label={t("table.leadTimeDays")} value={draft.leadTimeDays} onChange={(value) => setDraft({ ...draft, leadTimeDays: value })} />
          <TextField label={t("table.supplier")} value={draft.supplierName ?? ""} onChange={(value) => setDraft({ ...draft, supplierName: value || null })} />
          <TextField label={t("table.factory")} value={draft.factoryName ?? ""} onChange={(value) => setDraft({ ...draft, factoryName: value || null })} />
          <label>
            {t("table.active")}
            <select value={draft.isActive ? "true" : "false"} onChange={(event) => setDraft({ ...draft, isActive: event.target.value === "true" })}>
              <option value="true">{t("summary.yes")}</option>
              <option value="false">{t("summary.no")}</option>
            </select>
          </label>
          <button className="report-button primary" type="submit" disabled={saving}>{saving ? t("filters.loadingData") : t("filters.apply")}</button>
          </form>
        </SectionCard>
      ) : null}
      <SectionCard title={t("sections.systemReadiness")} eyebrow={t("sidebar.stockRules")}>
        <DataTable columns={columns} rows={rules} isLoading={loading} emptyMessage={t("filters.emptyFiltered")} />
      </SectionCard>
    </>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input min="0" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
