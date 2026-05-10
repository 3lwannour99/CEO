"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useI18n } from "@/i18n/useI18n";
import { getPermissions } from "@/services/permissionsApi";
import { createRole, getRoles, updateRole, updateRoleActive, updateRolePermissions } from "@/services/rolesApi";
import type { PermissionSummary, RoleDetail } from "@/types/inventory";
import styles from "./roles.module.css";

const actionColumns = ["view", "create", "edit", "delete", "manage", "execute", "activate", "assign", "update", "import", "export", "send", "other"] as const;
type PermissionAction = (typeof actionColumns)[number];

export default function RolesPage() {
  const { language, t } = useI18n();
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [permissions, setPermissions] = useState<PermissionSummary[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [draft, setDraft] = useState({ name: "", description: "", permissionKeys: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const filteredRoles = useMemo(
    () => roles.filter((role) => role.name.toLowerCase().includes(query.toLowerCase())),
    [query, roles],
  );
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Map<string, PermissionMatrixRow>>();
    permissions
      .filter((permission) => !isLegacyPermission(permission.key))
      .filter((permission) => {
        const text = `${permission.key} ${permission.labelEn ?? ""} ${permission.labelAr ?? ""}`.toLowerCase();
        return text.includes(permissionQuery.toLowerCase());
      })
      .forEach((permission) => {
        const category = permission.category || permission.key.split(".")[0] || "general";
        const parsed = parsePermission(permission);
        const categoryRows = groups.get(category) ?? new Map<string, PermissionMatrixRow>();
        const row = categoryRows.get(parsed.rowKey) ?? {
          key: parsed.rowKey,
          labelAr: parsed.labelAr,
          labelEn: parsed.labelEn,
          permissions: {},
        };
        row.permissions[parsed.action] = permission;
        categoryRows.set(parsed.rowKey, row);
        groups.set(category, categoryRows);
      });

    return Array.from(groups.entries())
      .map(([category, rows]) => [category, Array.from(rows.values()).sort((left, right) => left.labelEn.localeCompare(right.labelEn))] as const)
      .sort(([left], [right]) => left.localeCompare(right));
  }, [permissionQuery, permissions]);
  const permissionTotal = permissions.length;
  const filteredPermissionTotal = groupedPermissions.reduce(
    (total, [, rows]) => total + rows.reduce((rowTotal, row) => rowTotal + Object.keys(row.permissions).length, 0),
    0,
  );

  const startEditRole = useCallback((role: RoleDetail | null) => {
    setSelectedRoleId(role?.id ?? null);
    setDraft({
      description: role?.description ?? "",
      name: role?.name ?? "",
      permissionKeys: role?.permissionKeys ?? [],
    });
  }, []);

  const load = useCallback(async (preferredRoleId?: string | null) => {
    setLoading(true);
    try {
      const [roleRows, permissionRows] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      const nextRole = roleRows.find((role) => role.id === preferredRoleId) ?? roleRows[0] ?? null;
      startEditRole(nextRole);
      setError(null);
    } catch (loadError) {
      logError(loadError);
      setError(t("roles.updateFailed"));
    } finally {
      setLoading(false);
    }
  }, [startEditRole, t]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const name = draft.name.trim();
      const description = draft.description.trim();
      const saved = selectedRole
        ? await updateRole(selectedRole.id, { name, description })
        : await createRole({ name, description, permissionKeys: draft.permissionKeys });
      if (selectedRole) {
        await updateRolePermissions(saved.id, draft.permissionKeys);
      }
      setSuccess(selectedRole ? t("roles.updateSuccess") : t("roles.createSuccess"));
      await load(saved.id);
    } catch (saveError) {
      logError(saveError);
      setError(t("roles.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(key: string) {
    setDraft((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(key)
        ? current.permissionKeys.filter((item) => item !== key)
        : [...current.permissionKeys, key],
    }));
  }

  function setGroup(keys: string[], selected: boolean) {
    setDraft((current) => {
      const next = new Set(current.permissionKeys);
      keys.forEach((key) => (selected ? next.add(key) : next.delete(key)));
      return { ...current, permissionKeys: Array.from(next) };
    });
  }

  return (
    <div className={styles.page}>
      <PageHeader title={t("roles.title")} description={t("roles.subtitle")} />
      {error ? <p className={styles.errorNotice}>{error}</p> : null}
      {success ? <p className={styles.successNotice}>{success}</p> : null}
      <div className={styles.layout}>
        <SectionCard title={t("roles.title")} eyebrow={loading ? t("common.loading") : `${roles.length}`}>
          <div className={styles.toolbar}>
            <input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("roles.search")} />
            <button className={styles.secondaryButton} type="button" onClick={() => startEditRole(null)}>{t("roles.createRole")}</button>
          </div>
          <div className={styles.roleList}>
            {filteredRoles.map((role) => (
              <button className={`${styles.roleItem} ${role.id === selectedRoleId ? styles.selectedRole : ""}`} type="button" key={role.id} onClick={() => startEditRole(role)}>
                <span>{role.name}</span>
                <small>{role.userCount} {t("roles.assignedUsers")}</small>
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={selectedRole ? t("roles.editRole") : t("roles.createRole")} eyebrow={`${draft.permissionKeys.length} ${t("permissions.selectedCount")}`}>
          <form className={styles.editor} onSubmit={submit}>
            <div className={styles.editorTop}>
              {!selectedRole ? <p className={styles.createNotice}>{t("roles.createModeHint")}</p> : null}
              <div className={styles.roleFields}>
                <label className={styles.field}>
                  <span>{t("roles.roleName")}</span>
                  <input className={styles.input} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required disabled={selectedRole?.name === "SUPER_ADMIN"} />
                </label>
                <label className={styles.field}>
                  <span>{t("roles.description")}</span>
                  <textarea className={styles.textarea} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                </label>
              </div>
              {selectedRole?.name === "SUPER_ADMIN" ? <p className={styles.warning}>{t("roles.superAdminWarning")}</p> : null}
              <div className={styles.permissionToolbar}>
                <div>
                  <strong>{t("roles.permissions")}</strong>
                  <span>{filteredPermissionTotal} / {permissionTotal}</span>
                </div>
                <input className={styles.input} value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder={t("permissions.search")} />
                {selectedRole ? (
                  <button className={styles.secondaryButton} type="button" disabled={selectedRole.name === "SUPER_ADMIN"} onClick={() => void updateRoleActive(selectedRole.id, !selectedRole.isActive).then(() => load(selectedRole.id))}>
                    {selectedRole.isActive ? t("users.deactivate") : t("users.activate")}
                  </button>
                ) : null}
              </div>
            </div>
            <div className={styles.permissionGroups}>
              {groupedPermissions.length === 0 ? <p className={styles.emptyState}>{loading ? t("common.loading") : t("permissions.noPermissions")}</p> : null}
              {groupedPermissions.map(([category, rows]) => {
                const keys = rows.flatMap((row) => Object.values(row.permissions).map((permission) => permission.key));
                return (
                  <section className={styles.permissionGroup} key={category}>
                    <header>
                      <div>
                        <strong>{translateCategory(category, t)}</strong>
                        <span>{keys.length}</span>
                      </div>
                      <div>
                        <button type="button" onClick={() => setGroup(keys, true)}>{t("roles.selectAll")}</button>
                        <button type="button" onClick={() => setGroup(keys, false)}>{t("roles.clearAll")}</button>
                      </div>
                    </header>
                    <div className={styles.permissionTableWrap}>
                      <table className={styles.permissionTable}>
                        <thead>
                          <tr>
                            <th>{t("roles.permissionArea")}</th>
                            {actionColumns.map((action) => (
                              <th key={action}>{t(`permissionActions.${action}`)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.key}>
                              <th scope="row">
                                <span title={row.key}>{language === "ar" ? row.labelAr : row.labelEn}</span>
                              </th>
                              {actionColumns.map((action) => {
                                const permission = row.permissions[action];
                                return (
                                  <td key={action}>
                                    {permission ? (
                                      <label className={styles.matrixCheck} title={permission.key}>
                                        <input
                                          aria-label={`${permission.labelEn ?? permission.key}: ${action}`}
                                          type="checkbox"
                                          checked={draft.permissionKeys.includes(permission.key)}
                                          onChange={() => togglePermission(permission.key)}
                                        />
                                      </label>
                                    ) : (
                                      <span className={styles.notAvailable}>-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
            <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? t("common.loading") : t("roles.savePermissions")}</button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}

interface PermissionMatrixRow {
  key: string;
  labelEn: string;
  labelAr: string;
  permissions: Partial<Record<PermissionAction, PermissionSummary>>;
}

function parsePermission(permission: PermissionSummary) {
  const parts = permission.key.split(".");
  const rawAction = parts.at(-1) ?? "other";
  const action = normalizeAction(rawAction, parts);
  const rowParts = action === "other" ? parts : parts.slice(0, -1);
  const rowKey = rowParts.join(".");
  const labelEn = labelWithoutAction(permission.labelEn, rawAction) || formatKey(rowKey);
  const labelAr = labelWithoutAction(permission.labelAr, rawAction) || permission.labelAr || labelEn;

  return {
    action,
    labelAr,
    labelEn,
    rowKey,
  };
}

function isLegacyPermission(key: string) {
  return legacyPermissionKeys.has(key);
}

const legacyPermissionKeys = new Set([
  "dashboard.view",
  "inventory.view",
  "inventory.sync",
  "inventory.export",
  "alerts.view",
  "replenishment.view",
  "stockCoverage.view",
  "salesPerformance.view",
  "logistics.view",
  "multiLocation.view",
  "stockRules.view",
  "stockRules.manage",
  "snapshots.view",
  "settings.manage",
]);

function normalizeAction(rawAction: string, parts: string[]): PermissionAction {
  if (rawAction === "view" || rawAction === "create" || rawAction === "delete" || rawAction === "manage" || rawAction === "execute" || rawAction === "activate") {
    return rawAction;
  }

  if (rawAction === "edit" || rawAction === "editPermissions") {
    return "edit";
  }

  if (rawAction === "assignRoles") {
    return "assign";
  }

  if (rawAction.startsWith("update")) {
    return "update";
  }

  if (rawAction.startsWith("send")) {
    return "send";
  }

  if (parts[0] === "actions" && parts[1] === "import") {
    return "import";
  }

  if (parts[0] === "actions" && parts[1] === "export") {
    return "export";
  }

  return "other";
}

function labelWithoutAction(label: string | null | undefined, rawAction: string) {
  if (!label) {
    return "";
  }

  const parts = label.split(" / ");
  return parts.length > 1 && parts.at(-1)?.toLowerCase() === formatKey(rawAction).toLowerCase()
    ? parts.slice(0, -1).join(" / ")
    : parts.slice(0, -1).join(" / ") || label;
}

function formatKey(key: string) {
  return key
    .split(".")
    .map((part) => part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (value) => value.toUpperCase()))
    .join(" / ");
}

function translateCategory(category: string, t: (key: string) => string) {
  const translated = t(`permissionCategories.${category}`);
  if (translated !== `permissionCategories.${category}`) {
    return translated;
  }

  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function logError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
}
