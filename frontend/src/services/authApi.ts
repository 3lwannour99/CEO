import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { AuthLoginResponse, AuthUser, ManagedUser, RoleSummary } from "@/types/inventory";

export function login(username: string, password: string) {
  return apiPost<AuthLoginResponse>("/auth/login", { email: username, password });
}

export function getCurrentUser() {
  return apiGet<AuthUser>("/auth/me");
}

export function logout() {
  return apiPost<{ ok: boolean }>("/auth/logout");
}

export function getUsers() {
  return apiGet<ManagedUser[]>("/users");
}

export function getRoles() {
  return apiGet<Array<RoleSummary & { rolePermissions?: unknown[] }>>("/users/roles");
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

export function updateUserRoles(id: string, roleNames: string[]) {
  return apiPatch<ManagedUser>(`/users/${id}/roles`, { roleNames });
}

export function updateUserActive(id: string, isActive: boolean) {
  return apiPatch<ManagedUser>(`/users/${id}/active`, { isActive });
}
