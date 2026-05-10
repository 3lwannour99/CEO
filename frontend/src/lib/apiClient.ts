const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const ACCESS_TOKEN_KEY = "ceoreport_access_token";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryParams = object | undefined;

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  window.dispatchEvent(new Event("ceoreport-auth-token-changed"));
}

function authHeaders(headers?: HeadersInit): HeadersInit {
  const token = getAccessToken();

  return token ? { ...headers, Authorization: `Bearer ${token}` } : (headers ?? {});
}

export function buildQuery(params?: QueryParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
    cache: "no-store",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE", headers: authHeaders() });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : new Intl.NumberFormat("en").format(value);
}

export function formatCurrency(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "-"
    : new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
