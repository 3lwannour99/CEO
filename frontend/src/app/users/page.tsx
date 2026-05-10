"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/DataTable/DataTable";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { SectionCard } from "@/components/SectionCard/SectionCard";
import { useI18n } from "@/i18n/useI18n";
import { useAuth } from "@/providers/AuthProvider/AuthProvider";
import { createUser, getRoles, getUsers, updateUserActive, updateUserRoles } from "@/services/authApi";
import type { ManagedUser, RoleSummary } from "@/types/inventory";
import styles from "./users.module.css";

export default function UsersPage() {
  const auth = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    email: "",
    fullName: "",
    password: "",
    roleName: "VIEWER",
  });
  const canManage = auth.hasPermission("users.manage");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userRows, roleRows] = await Promise.all([getUsers(), getRoles()]);
      setUsers(userRows);
      setRoles(roleRows);
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
      email: draft.email.trim(),
      fullName: draft.fullName.trim(),
      password: draft.password,
      roleName: draft.roleName,
    };

    if (!nextDraft.fullName || !nextDraft.email || !nextDraft.password || !nextDraft.roleName) {
      setError(t("users.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      await createUser({
        email: nextDraft.email,
        fullName: nextDraft.fullName,
        password: nextDraft.password,
        roleNames: [nextDraft.roleName],
      });
      setDraft({ email: "", fullName: "", password: "", roleName: "VIEWER" });
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

  const columns: DataTableColumn<ManagedUser>[] = [
    { key: "name", header: t("common.name"), render: (row) => row.fullName },
    { key: "email", header: t("common.username"), render: (row) => <span className={styles.usernameText}>{row.email}</span> },
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
              <input className={styles.input} dir="ltr" type="text" autoComplete="username" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required />
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
    </div>
  );
}

function logError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
}
