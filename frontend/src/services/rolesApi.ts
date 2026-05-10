import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { RoleDetail } from "@/types/inventory";

export function getRoles() {
  return apiGet<RoleDetail[]>("/roles");
}

export function getRole(id: string) {
  return apiGet<RoleDetail>(`/roles/${id}`);
}

export function createRole(input: { name: string; description?: string; permissionKeys?: string[]; isActive?: boolean }) {
  return apiPost<RoleDetail>("/roles", input);
}

export function updateRole(id: string, input: { name?: string; description?: string; isActive?: boolean }) {
  return apiPatch<RoleDetail>(`/roles/${id}`, input);
}

export function updateRolePermissions(id: string, permissionKeys: string[]) {
  return apiPatch<RoleDetail>(`/roles/${id}/permissions`, { permissionKeys });
}

export function updateRoleActive(id: string, isActive: boolean) {
  return apiPatch<RoleDetail>(`/roles/${id}/active`, { isActive });
}

export function deleteRole(id: string) {
  return apiDelete<RoleDetail>(`/roles/${id}`);
}
