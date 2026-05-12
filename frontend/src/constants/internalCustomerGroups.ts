export const INTERNAL_CUSTOMER_GROUPS = [
  "Due From - Sister Companies",
  "Sister Company",
  "Syster Company",
  "Trade Debtors - Sis.Comp",
] as const;

export function normalizeCustomerGroup(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export const INTERNAL_CUSTOMER_GROUP_KEYS = new Set(
  INTERNAL_CUSTOMER_GROUPS.map((value) => normalizeCustomerGroup(value)),
);

