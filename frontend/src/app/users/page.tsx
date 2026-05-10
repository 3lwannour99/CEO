"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useI18n } from "@/i18n/useI18n";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import { createUser, getAssignableRoles, getUsers, updateUserActive, updateUserPermissions, updateUserRoles } from "@/services/usersApi";
import { getPermissions } from "@/services/permissionsApi";
import type { ManagedUser, PermissionSummary, RoleSummary } from "@/types/inventory";
import styles from "./users.module.css";

export default function UsersPage() {
  const auth = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<PermissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    username: "",
    fullName: "",
    password: "",
    roleName: "VIEWER",
  });
  const canManage = auth.hasPermission("users.manage");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userRows, roleRows, permissionRows] = await Promise.all([getUsers(), getAssignableRoles(), getPermissions()]);
      setUsers(userRows);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setError(null);
    } catch (loadError) {
      logError(loadError);
      setError(t("users.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nextDraft = {
      username: draft.username.trim().toLowerCase(),
      fullName: draft.fullName.trim(),
      password: draft.password,
      roleName: draft.roleName,
    };

    if (!nextDraft.fullName || !nextDraft.username || !nextDraft.password || !nextDraft.roleName) {
      setError(t("users.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      await createUser({
        username: nextDraft.username,
        fullName: nextDraft.fullName,
        password: nextDraft.password,
        roleNames: [nextDraft.roleName],
      });
      setDraft({ username: "", fullName: "", password: "", roleName: "VIEWER" });
      setSuccess(t("users.createSuccess"));
      await load();
    } catch (submitError) {
      logError(submitError);
      setError(t("users.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(userId: string, roleName: string) {
    setUpdatingUserId(userId);
    setError(null);
    setSuccess(null);
    try {
      await updateUserRoles(userId, [roleName]);
      await load();
    } catch (roleError) {
      logError(roleError);
      setError(t("users.updateFailed"));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function toggleActive(user: ManagedUser) {
    setUpdatingUserId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await updateUserActive(user.id, !user.isActive);
      await load();
    } catch (statusError) {
      logError(statusError);
      setError(t("users.updateFailed"));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function changePermissionOverride(user: ManagedUser, permissionKey: string, effect: "inherit" | "allow" | "deny") {
    setUpdatingUserId(user.id);
    setError(null);
    setSuccess(null);
    const allow = new Set(user.directAllowPermissions ?? []);
    const deny = new Set(user.directDenyPermissions ?? []);
    allow.delete(permissionKey);
    deny.delete(permissionKey);
    if (effect === "allow") {
      allow.add(permissionKey);
    }
    if (effect === "deny") {
      deny.add(permissionKey);
    }

    try {
      await updateUserPermissions(user.id, Array.from(allow), Array.from(deny));
      await load();
    } catch (permissionError) {
      logError(permissionError);
      setError(t("users.updateFailed"));
    } finally {
      setUpdatingUserId(null);
    }
  }

  const columns: DataTableColumn<ManagedUser>[] = [
    { key: "name", header: t("common.name"), render: (row) => row.fullName },
    { key: "username", header: t("common.username"), render: (row) => <span className={styles.usernameText}>{row.username}</span> },
    {
      key: "roles",
      header: t("users.roles"),
      render: (row) => (
        <div className={styles.roleChips}>
          {row.roles.length ? row.roles.map((role) => <span className={styles.roleChip} key={role.id}>{role.name}</span>) : <span className={styles.muted}>-</span>}
        </div>
      ),
    },
    {
      key: "active",
      header: t("common.status"),
      render: (row) => (
        <span className={`${styles.statusPill} ${row.isActive ? styles.activeStatus : styles.inactiveStatus}`}>
          {row.isActive ? t("users.active") : t("users.inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("users.actions"),
      render: (row) =>
        canManage ? (
          <div className={styles.tableActions}>
            <select className={styles.inlineSelect} value={row.roles[0]?.name ?? ""} disabled={updatingUserId === row.id} onChange={(event) => void changeRole(row.id, event.target.value)}>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            <button className={styles.secondaryButton} type="button" disabled={updatingUserId === row.id} onClick={() => void toggleActive(row)}>
              {row.isActive ? t("users.deactivate") : t("users.activate")}
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader title={t("users.title")} description={t("users.subtitle")} />
      {error ? <p className={styles.errorNotice}>{error}</p> : null}
      {success ? <p className={styles.successNotice}>{success}</p> : null}
      {canManage ? (
        <SectionCard title={t("users.createUser")} eyebrow={t("users.accessControl")}>
          <form className={styles.createForm} onSubmit={submit}>
            <label className={styles.field}>
              <span>{t("users.fullName")}</span>
              <input className={styles.input} value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} required />
            </label>
            <label className={styles.field}>
              <span>{t("users.username")}</span>
              <input className={styles.input} dir="ltr" type="text" autoComplete="username" value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} required />
            </label>
            <label className={styles.field}>
              <span>{t("users.password")}</span>
              <input className={styles.input} dir="ltr" type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} required minLength={8} />
            </label>
            <label className={styles.field}>
              <span>{t("users.role")}</span>
              <select className={styles.input} value={draft.roleName} onChange={(event) => setDraft({ ...draft, roleName: event.target.value })}>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </label>
            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? t("common.loading") : t("users.createUser")}</button>
            </div>
          </form>
        </SectionCard>
      ) : null}
      <SectionCard title={t("users.title")} eyebrow={t("users.accessControl")}>
        <DataTable columns={columns} rows={users} isLoading={loading} emptyMessage={loading ? t("users.loading") : t("users.noUsers")} getRowKey={(row) => row.id} />
      </SectionCard>
      {canManage ? (
        <SectionCard title={t("users.directPermissions")} eyebrow={t("users.effectivePermissions")}>
          <div className={styles.permissionGrid}>
            {users.map((user) => (
              <details className={styles.permissionUser} key={user.id}>
                <summary>
                  <span>{user.fullName}</span>
                  <span className={styles.muted}>{(user.permissions ?? []).length} {t("permissions.effective")}</span>
                </summary>
                <div className={styles.permissionList}>
                  {permissions.map((permission) => {
                    const state = (user.directDenyPermissions ?? []).includes(permission.key)
                      ? "deny"
                      : (user.directAllowPermissions ?? []).includes(permission.key)
                        ? "allow"
                        : "inherit";
                    return (
                      <div className={styles.permissionRow} key={permission.key}>
                        <div>
                          <strong>{permission.labelEn ?? permission.key}</strong>
                          <small>{permission.key}</small>
                        </div>
                        <select
                          className={styles.inlineSelect}
                          value={state}
                          disabled={updatingUserId === user.id}
                          onChange={(event) => void changePermissionOverride(user, permission.key, event.target.value as "inherit" | "allow" | "deny")}
                        >
                          <option value="inherit">{t("permissions.inherit")}</option>
                          <option value="allow">{t("permissions.allow")}</option>
                          <option value="deny">{t("permissions.deny")}</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function logError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
}
