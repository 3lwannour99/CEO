const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryParams = object | undefined;

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

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en").format(date);
}
