import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { ManagedUser, RoleSummary } from "@/types/inventory";

export function getUsers() {
  return apiGet<ManagedUser[]>("/users");
}

export function getUser(id: string) {
  return apiGet<ManagedUser>(`/users/${id}`);
}

export function getUserPermissions(id: string) {
  return apiGet<{
    rolePermissions: string[];
    directAllowPermissions: string[];
    directDenyPermissions: string[];
    permissions: string[];
  }>(`/users/${id}/permissions`);
}

export function getAssignableRoles() {
  return apiGet<Array<RoleSummary & { rolePermissions?: unknown[] }>>("/roles");
}

export function createUser(input: {
  email: string;
  fullName: string;
  password: string;
  roleNames: string[];
  isActive?: boolean;
}) {
  return apiPost<ManagedUser>("/users", input);
}

export function updateUser(id: string, input: { email?: string; fullName?: string; isActive?: boolean; roleNames?: string[] }) {
  return apiPatch<ManagedUser>(`/users/${id}`, input);
}

export function updateUserRoles(id: string, roleNames: string[]) {
  return apiPatch<ManagedUser>(`/users/${id}/roles`, { roleNames });
}

export function updateUserPermissions(id: string, allowPermissionKeys: string[], denyPermissionKeys: string[]) {
  return apiPatch<ManagedUser>(`/users/${id}/permissions`, { allowPermissionKeys, denyPermissionKeys });
}

export function updateUserActive(id: string, isActive: boolean) {
  return apiPatch<ManagedUser>(`/users/${id}/active`, { isActive });
}
