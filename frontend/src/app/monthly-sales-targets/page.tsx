"use client";

import { DragEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@/components/MultiSelect/MultiSelect";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useI18n } from "@/i18n/useI18n";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { formatNumber } from "@/lib/apiClient";
import { getFilterOptions } from "@/lib/filterOptions";
import {
  assignMonthlySalesman,
  createMonthlySalesLocation,
  deleteMonthlySalesLocation,
  getMonthlySalesManagementBoard,
  setMonthlySalesLocationActive,
  unassignMonthlySalesman,
  updateMonthlySalesLocation,
} from "@/services/monthlySalesApi";
import type {
  MonthlySalesAssignment,
  MonthlySalesLocation,
  MonthlySalesLocationInput,
  MonthlySalesManagementBoard,
} from "@/types/monthlySales";
import styles from "./page.module.css";

const ALL_BRANDS = ["JAC", "FORTHING", "ROX"] as const;

interface DraggedSalesman {
  assignmentId?: string;
  salesmanName: string;
  salesmanCode?: string;
  allowedBrands: Array<(typeof ALL_BRANDS)[number]>;
}

export default function MonthlySalesTargetsPage() {
  const { t } = useI18n();
  const { filters, setFilters } = useGlobalFilters();
  const { inventoryItems, sources } = useInventoryData();
  const countries = filters.countries;
  const countryOptions = useMemo(
    () => getFilterOptions(inventoryItems, sources).countries,
    [inventoryItems, sources],
  );
  const [targetMonth, setTargetMonth] = useState(currentMonth());
  const [board, setBoard] = useState<MonthlySalesManagementBoard | null>(null);
  const [draft, setDraft] = useState<MonthlySalesLocationInput>(() =>
    emptyLocation(currentMonth()),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragged, setDragged] = useState<DraggedSalesman | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await getMonthlySalesManagementBoard(targetMonth, countries));
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("monthlySalesTargets.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [countries, targetMonth, t]);

  useEffect(() => {
    queueMicrotask(() => void loadBoard());
  }, [loadBoard]);

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateMonthlySalesLocation(editingId, draft);
      else await createMonthlySalesLocation(draft);
      resetDraft(targetMonth);
      await loadBoard();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("monthlySalesTargets.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function editLocation(location: MonthlySalesLocation) {
    setEditingId(location.id);
    setDraft({
      targetMonth: location.targetMonth,
      salesLocation: location.salesLocation,
      target: location.target,
      isActive: location.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function dropOnLocation(locationId: string) {
    if (!dragged) return;
    setDropTarget(null);
    try {
      await assignMonthlySalesman({
        targetMonth,
        salesmanName: dragged.salesmanName,
        salesmanCode: dragged.salesmanCode,
        locationId,
        allowedBrands: dragged.allowedBrands,
      });
      setDragged(null);
      await loadBoard();
    } catch (moveError) {
      setError(
        moveError instanceof Error ? moveError.message : t("monthlySalesTargets.saveFailed"),
      );
    }
  }

  async function dropOnUnassigned() {
    if (!dragged?.assignmentId) {
      setDragged(null);
      setDropTarget(null);
      return;
    }
    try {
      await unassignMonthlySalesman(dragged.assignmentId);
      setDragged(null);
      setDropTarget(null);
      await loadBoard();
    } catch (moveError) {
      setError(
        moveError instanceof Error ? moveError.message : t("monthlySalesTargets.saveFailed"),
      );
    }
  }

  async function deleteLocation(location: MonthlySalesLocation) {
    if (!window.confirm(t("monthlySalesTargets.deleteLocationConfirm"))) return;
    setSaving(true);
    try {
      await deleteMonthlySalesLocation(location.id);
      if (editingId === location.id) resetDraft(targetMonth);
      await loadBoard();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : t("monthlySalesTargets.deleteFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function resetDraft(month: string) {
    setEditingId(null);
    setDraft(emptyLocation(month));
  }

  const visibleUnassignedSalesmen = (board?.unassignedSalesmen ?? []).filter((salesman) =>
    matchesSalesmanSearch(salesman.salesmanName, undefined, columnSearches.unassigned),
  );

  return (
    <>
      <PageHeader
        title={t("monthlySalesTargets.title")}
        description={t("monthlySalesTargets.dragDescription")}
      />
      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <SectionCard
        title={
          editingId ? t("monthlySalesTargets.editLocation") : t("monthlySalesTargets.addLocation")
        }
        eyebrow={targetMonth}
      >
        <form className={styles.form} onSubmit={saveLocation}>
          <Field label={t("monthlySalesTargets.targetMonth")}>
            <input
              type="month"
              value={targetMonth}
              onChange={(event) => {
                const month = event.target.value;
                setTargetMonth(month);
                resetDraft(month);
              }}
              required
            />
          </Field>
          <Field label={t("monthlySalesReport.salesLocation")}>
            <input
              value={draft.salesLocation}
              onChange={(event) =>
                setDraft((current) => ({ ...current, salesLocation: event.target.value }))
              }
              required
            />
          </Field>
          <Field label={t("monthlySalesTargets.locationTarget")}>
            <input
              type="number"
              min="0"
              value={draft.target}
              onChange={(event) =>
                setDraft((current) => ({ ...current, target: Number(event.target.value) }))
              }
              required
            />
          </Field>
          <Field label={t("table.active")}>
            <select
              value={draft.isActive === false ? "false" : "true"}
              onChange={(event) =>
                setDraft((current) => ({ ...current, isActive: event.target.value === "true" }))
              }
            >
              <option value="true">{t("summary.yes")}</option>
              <option value="false">{t("summary.no")}</option>
            </select>
          </Field>
          <div className={styles.formActions}>
            {editingId ? (
              <button type="button" onClick={() => resetDraft(targetMonth)}>
                {t("common.cancel")}
              </button>
            ) : null}
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title={t("monthlySalesTargets.assignmentBoard")}
        eyebrow={loading ? t("common.loading") : formatNumber(totalSalesmen(board))}
      >
        <div className={styles.boardFilters}>
          <MultiSelect
            label={t("filters.country")}
            options={countryOptions}
            values={countries}
            onChange={(selectedCountries) =>
              setFilters({ ...filters, countries: selectedCountries })
            }
          />
        </div>
        <p className={styles.instructions}>{t("monthlySalesTargets.dragInstructions")}</p>
        <div className={styles.board}>
          <DropColumn
            title={t("monthlySalesTargets.unassigned")}
            count={visibleUnassignedSalesmen.length}
            className={styles.unassignedColumn}
            active={dropTarget === "unassigned"}
            searchValue={columnSearches.unassigned ?? ""}
            searchPlaceholder={t("monthlySalesTargets.searchSalesman")}
            onSearchChange={(value) =>
              setColumnSearches((current) => ({ ...current, unassigned: value }))
            }
            onDragOver={(event) => dragOver(event, "unassigned", setDropTarget)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={() => void dropOnUnassigned()}
          >
            {visibleUnassignedSalesmen.map((salesman) => (
              <SalesmanCard
                key={salesman.salesmanName}
                salesman={{ salesmanName: salesman.salesmanName, allowedBrands: [...ALL_BRANDS] }}
                onDragStart={setDragged}
              />
            ))}
          </DropColumn>

          {(board?.locations ?? []).map((location) => {
            const searchValue = columnSearches[location.id] ?? "";
            const visibleAssignments = location.assignments.filter((assignment) =>
              matchesSalesmanSearch(assignment.salesmanName, assignment.salesmanCode, searchValue),
            );

            return (
              <DropColumn
                key={location.id}
                title={location.salesLocation}
                count={visibleAssignments.length}
                active={dropTarget === location.id}
                muted={!location.isActive}
                searchValue={searchValue}
                searchPlaceholder={t("monthlySalesTargets.searchSalesman")}
                onSearchChange={(value) =>
                  setColumnSearches((current) => ({ ...current, [location.id]: value }))
                }
                onDragOver={(event) => dragOver(event, location.id, setDropTarget)}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() => void dropOnLocation(location.id)}
                headerActions={
                  <>
                    <strong>
                      {t("monthlySalesTargets.locationTarget")}: {formatNumber(location.target)}
                    </strong>
                    <button type="button" onClick={() => editLocation(location)}>
                      {t("actions.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void setMonthlySalesLocationActive(location.id, !location.isActive).then(
                          loadBoard,
                        )
                      }
                    >
                      {location.isActive
                        ? t("monthlySalesTargets.disable")
                        : t("monthlySalesTargets.enable")}
                    </button>
                    <button
                      className={styles.deleteButton}
                      type="button"
                      disabled={saving}
                      onClick={() => void deleteLocation(location)}
                    >
                      {t("actions.delete")}
                    </button>
                  </>
                }
              >
                {visibleAssignments.map((assignment) => (
                  <SalesmanCard
                    key={assignment.id}
                    salesman={assignmentToDrag(assignment)}
                    onDragStart={setDragged}
                  />
                ))}
              </DropColumn>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}

function DropColumn({
  title,
  count,
  active,
  muted,
  className = "",
  headerActions,
  searchValue,
  searchPlaceholder,
  children,
  onSearchChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  title: string;
  count: number;
  active: boolean;
  muted?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  searchValue: string;
  searchPlaceholder: string;
  children: React.ReactNode;
  onSearchChange: (value: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      className={`${styles.column} ${className} ${active ? styles.dropActive : ""} ${muted ? styles.muted : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.columnHeader}>
        <div>
          <h3>{title}</h3>
          <span>{formatNumber(count)}</span>
        </div>
        {headerActions ? <div className={styles.columnActions}>{headerActions}</div> : null}
        <input
          className={styles.columnSearch}
          type="search"
          value={searchValue}
          placeholder={searchPlaceholder}
          aria-label={`${searchPlaceholder} - ${title}`}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className={styles.cardList}>{children}</div>
    </div>
  );
}

function SalesmanCard({
  salesman,
  onDragStart,
}: {
  salesman: DraggedSalesman;
  onDragStart: (salesman: DraggedSalesman) => void;
}) {
  return (
    <div
      className={styles.salesmanCard}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", salesman.salesmanName);
        onDragStart(salesman);
      }}
    >
      <span className={styles.dragHandle} aria-hidden="true">
        ::
      </span>
      <div>
        <strong>{salesman.salesmanName}</strong>
        <small>{salesman.allowedBrands.join(" / ")}</small>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function dragOver(
  event: DragEvent<HTMLDivElement>,
  target: string,
  setTarget: (target: string) => void,
) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  setTarget(target);
}

function assignmentToDrag(assignment: MonthlySalesAssignment): DraggedSalesman {
  return {
    assignmentId: assignment.id,
    salesmanName: assignment.salesmanName,
    salesmanCode: assignment.salesmanCode ?? undefined,
    allowedBrands: assignment.allowedBrands,
  };
}

function matchesSalesmanSearch(
  salesmanName: string,
  salesmanCode: string | null | undefined,
  search = "",
) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  if (!normalizedSearch) return true;
  return `${salesmanName} ${salesmanCode ?? ""}`.toLocaleLowerCase().includes(normalizedSearch);
}

function totalSalesmen(board: MonthlySalesManagementBoard | null) {
  return (
    (board?.unassignedSalesmen.length ?? 0) +
    (board?.locations.reduce((sum, location) => sum + location.assignments.length, 0) ?? 0)
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function emptyLocation(targetMonth: string): MonthlySalesLocationInput {
  return { targetMonth, salesLocation: "", target: 0, isActive: true };
}
