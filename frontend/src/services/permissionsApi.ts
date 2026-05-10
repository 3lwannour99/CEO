import { apiGet } from "@/lib/apiClient";
import type { PermissionSummary } from "@/types/inventory";

export function getPermissions() {
  return apiGet<PermissionSummary[]>("/permissions");
}
