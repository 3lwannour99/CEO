import { apiGet, apiPost } from "@/lib/apiClient";
import type { AuthLoginResponse, AuthUser } from "@/types/inventory";

export function login(username: string, password: string) {
  return apiPost<AuthLoginResponse>("/auth/login", { username, password });
}

export function getCurrentUser() {
  return apiGet<AuthUser>("/auth/me");
}

export function logout() {
  return apiPost<{ ok: boolean }>("/auth/logout");
}
