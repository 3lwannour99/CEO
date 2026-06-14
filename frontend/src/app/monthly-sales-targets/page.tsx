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
  createMonthlySalesGroup,
  createMonthlySalesLocation,
  deleteMonthlySalesGroup,
  deleteMonthlySalesLocation,
  getMonthlySalesManagementBoard,
  reorderMonthlySalesAssignments,
  reorderMonthlySalesLocations,
  setMonthlySalesLocationActive,
  unassignMonthlySalesman,
  updateMonthlySalesGroup,
  updateMonthlySalesLocation,
} from "@/services/monthlySalesApi";
import type {
  MonthlySalesAssignment,
  MonthlySalesGroup,
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
  locationId?: string;
  groupId?: string;
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
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const [locationDropTarget, setLocationDropTarget] = useState<string | null>(null);
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
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

  async function dropOnLocation(locationId: string, groupId?: string) {
    if (!dragged) return;
    setDropTarget(null);
    try {
      await assignMonthlySalesman({
        targetMonth,
        salesmanName: dragged.salesmanName,
        salesmanCode: dragged.salesmanCode,
        locationId,
        groupId,
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

  async function dropSalesmanBefore(
    locationId: string,
    groupId: string | undefined,
    assignments: MonthlySalesAssignment[],
    targetAssignmentId: string,
  ) {
    if (!dragged?.assignmentId) return;
    if (dragged.locationId !== locationId || dragged.groupId !== groupId) {
      await dropOnLocation(locationId, groupId);
      return;
    }
    const nextAssignments = reorderAssignments(
      assignments,
      dragged.assignmentId,
      targetAssignmentId,
    );
    if (nextAssignments === assignments) return;
    setDropTarget(null);
    try {
      await reorderMonthlySalesAssignments({
        locationId,
        groupId,
        assignmentIds: nextAssignments.map((assignment) => assignment.id),
      });
      setDragged(null);
      await loadBoard();
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : t("monthlySalesTargets.reorderFailed"),
      );
    }
  }

  async function addGroup(locationId: string) {
    const name = groupDrafts[locationId]?.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createMonthlySalesGroup({ locationId, name });
      setGroupDrafts((current) => ({ ...current, [locationId]: "" }));
      await loadBoard();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("monthlySalesTargets.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function renameGroup(group: MonthlySalesGroup) {
    const name = window.prompt(t("monthlySalesTargets.groupName"), group.name)?.trim();
    if (!name || name === group.name) return;
    try {
      await updateMonthlySalesGroup(group.id, { locationId: group.locationId, name });
      await loadBoard();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("monthlySalesTargets.saveFailed"),
      );
    }
  }

  async function removeGroup(group: MonthlySalesGroup) {
    if (!window.confirm(t("monthlySalesTargets.deleteGroupConfirm"))) return;
    try {
      await deleteMonthlySalesGroup(group.id);
      await loadBoard();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : t("monthlySalesTargets.deleteFailed"),
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

  async function dropLocationBefore(targetLocationId: string) {
    if (!board || !draggedLocationId || draggedLocationId === targetLocationId) {
      setDraggedLocationId(null);
      setLocationDropTarget(null);
      return;
    }
    const previousLocations = board.locations;
    const nextLocations = reorderLocations(previousLocations, draggedLocationId, targetLocationId);
    setBoard({ ...board, locations: nextLocations });
    setDraggedLocationId(null);
    setLocationDropTarget(null);
    try {
      await reorderMonthlySalesLocations(
        targetMonth,
        nextLocations.map((location) => location.id),
      );
      await loadBoard();
    } catch (reorderError) {
      setBoard((current) => (current ? { ...current, locations: previousLocations } : current));
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : t("monthlySalesTargets.reorderFailed"),
      );
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
            const ungroupedAssignments = visibleAssignments.filter(
              (assignment) => !assignment.groupId,
            );
            const allUngroupedAssignments = location.assignments.filter(
              (assignment) => !assignment.groupId,
            );

            return (
              <DropColumn
                key={location.id}
                title={location.salesLocation}
                count={visibleAssignments.length}
                active={dropTarget === location.id}
                locationDropActive={locationDropTarget === location.id}
                muted={!location.isActive}
                locationId={location.id}
                locationDragLabel={t("monthlySalesTargets.dragLocation")}
                searchValue={searchValue}
                searchPlaceholder={t("monthlySalesTargets.searchSalesman")}
                onSearchChange={(value) =>
                  setColumnSearches((current) => ({ ...current, [location.id]: value }))
                }
                onLocationDragStart={(locationId) => {
                  setDragged(null);
                  setDraggedLocationId(locationId);
                }}
                onLocationDragEnd={() => {
                  setDraggedLocationId(null);
                  setLocationDropTarget(null);
                }}
                onDragOver={(event) => {
                  if (draggedLocationId) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setLocationDropTarget(location.id);
                    return;
                  }
                  dragOver(event, location.id, setDropTarget);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() =>
                  void (draggedLocationId
                    ? dropLocationBefore(location.id)
                    : dropOnLocation(location.id))
                }
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
                <div className={styles.groupCreator}>
                  <input
                    value={groupDrafts[location.id] ?? ""}
                    placeholder={t("monthlySalesTargets.groupName")}
                    onChange={(event) =>
                      setGroupDrafts((current) => ({
                        ...current,
                        [location.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addGroup(location.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={saving || !groupDrafts[location.id]?.trim()}
                    onClick={() => void addGroup(location.id)}
                  >
                    {t("monthlySalesTargets.addGroup")}
                  </button>
                </div>
                <GroupSection
                  title={t("monthlySalesTargets.ungrouped")}
                  assignments={ungroupedAssignments}
                  allAssignments={allUngroupedAssignments}
                  active={dropTarget === `${location.id}:ungrouped`}
                  onDragOver={(event) =>
                    dragOver(event, `${location.id}:ungrouped`, setDropTarget)
                  }
                  onDrop={(event) => {
                    event.stopPropagation();
                    void dropOnLocation(location.id);
                  }}
                  onDragStart={setDragged}
                  onDropBefore={(assignments, targetAssignmentId) =>
                    void dropSalesmanBefore(
                      location.id,
                      undefined,
                      assignments,
                      targetAssignmentId,
                    )
                  }
                />
                {location.groups.map((group) => (
                  <GroupSection
                    key={group.id}
                    title={group.name}
                    assignments={visibleAssignments.filter(
                      (assignment) => assignment.groupId === group.id,
                    )}
                    allAssignments={location.assignments.filter(
                      (assignment) => assignment.groupId === group.id,
                    )}
                    active={dropTarget === group.id}
                    onDragOver={(event) => dragOver(event, group.id, setDropTarget)}
                    onDrop={(event) => {
                      event.stopPropagation();
                      void dropOnLocation(location.id, group.id);
                    }}
                    onDragStart={setDragged}
                    onDropBefore={(assignments, targetAssignmentId) =>
                      void dropSalesmanBefore(
                        location.id,
                        group.id,
                        assignments,
                        targetAssignmentId,
                      )
                    }
                    actions={
                      <>
                        <button type="button" onClick={() => void renameGroup(group)}>
                          {t("actions.edit")}
                        </button>
                        <button type="button" onClick={() => void removeGroup(group)}>
                          {t("actions.delete")}
                        </button>
                      </>
                    }
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

function GroupSection({
  title,
  assignments,
  allAssignments,
  active,
  actions,
  onDragOver,
  onDrop,
  onDragStart,
  onDropBefore,
}: {
  title: string;
  assignments: MonthlySalesAssignment[];
  allAssignments: MonthlySalesAssignment[];
  active: boolean;
  actions?: React.ReactNode;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragStart: (salesman: DraggedSalesman) => void;
  onDropBefore: (
    assignments: MonthlySalesAssignment[],
    targetAssignmentId: string,
  ) => void;
}) {
  return (
    <section
      className={`${styles.groupSection} ${active ? styles.groupDropActive : ""}`}
      onDragOver={(event) => {
        event.stopPropagation();
        onDragOver(event);
      }}
      onDragLeave={() => undefined}
      onDrop={onDrop}
    >
      <div className={styles.groupHeader}>
        <strong>{title}</strong>
        <span>{formatNumber(assignments.length)}</span>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className={styles.groupCards}>
        {assignments.map((assignment) => (
          <SalesmanCard
            key={assignment.id}
            salesman={assignmentToDrag(assignment)}
            onDragStart={onDragStart}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDropBefore(allAssignments, assignment.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function DropColumn({
  title,
  count,
  active,
  locationDropActive,
  muted,
  className = "",
  headerActions,
  locationId,
  locationDragLabel,
  searchValue,
  searchPlaceholder,
  children,
  onLocationDragStart,
  onLocationDragEnd,
  onSearchChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  title: string;
  count: number;
  active: boolean;
  locationDropActive?: boolean;
  muted?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  locationId?: string;
  locationDragLabel?: string;
  searchValue: string;
  searchPlaceholder: string;
  children: React.ReactNode;
  onLocationDragStart?: (locationId: string) => void;
  onLocationDragEnd?: () => void;
  onSearchChange: (value: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      className={`${styles.column} ${className} ${active ? styles.dropActive : ""} ${locationDropActive ? styles.locationDropActive : ""} ${muted ? styles.muted : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.columnHeader}>
        <div>
          <div className={styles.columnTitle}>
            {locationId ? (
              <button
                className={styles.locationDragHandle}
                type="button"
                draggable
                aria-label={`${locationDragLabel} - ${title}`}
                title={locationDragLabel}
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/monthly-sales-location", locationId);
                  onLocationDragStart?.(locationId);
                }}
                onDragEnd={() => onLocationDragEnd?.()}
              >
                ::
              </button>
            ) : null}
            <h3>{title}</h3>
          </div>
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
  onDragOver,
  onDrop,
}: {
  salesman: DraggedSalesman;
  onDragStart: (salesman: DraggedSalesman) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={styles.salesmanCard}
      draggable
      onDragOver={onDragOver}
      onDrop={onDrop}
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
  event: DragEvent<HTMLElement>,
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
    locationId: assignment.locationId,
    groupId: assignment.groupId ?? undefined,
    allowedBrands: assignment.allowedBrands,
  };
}

function reorderAssignments(
  assignments: MonthlySalesAssignment[],
  draggedId: string,
  targetId: string,
) {
  if (draggedId === targetId) return assignments;
  const next = [...assignments].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.salesmanName.localeCompare(right.salesmanName),
  );
  const draggedIndex = next.findIndex((assignment) => assignment.id === draggedId);
  const targetIndex = next.findIndex((assignment) => assignment.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return assignments;
  const [draggedAssignment] = next.splice(draggedIndex, 1);
  const nextTargetIndex = next.findIndex((assignment) => assignment.id === targetId);
  next.splice(nextTargetIndex, 0, draggedAssignment);
  return next;
}

function reorderLocations(locations: MonthlySalesLocation[], draggedId: string, targetId: string) {
  const next = [...locations];
  const draggedIndex = next.findIndex((location) => location.id === draggedId);
  const targetIndex = next.findIndex((location) => location.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return next;
  const movingForward = draggedIndex < targetIndex;
  const [draggedLocation] = next.splice(draggedIndex, 1);
  const currentTargetIndex = next.findIndex((location) => location.id === targetId);
  const insertionIndex = movingForward ? currentTargetIndex + 1 : currentTargetIndex;
  next.splice(insertionIndex, 0, draggedLocation);
  return next.map((location, sortOrder) => ({ ...location, sortOrder }));
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
