import { INTERNAL_CUSTOMER_GROUP_KEYS, normalizeCustomerGroup } from "@/constants/internalCustomerGroups";
import type { InventoryItem, TransactionClass } from "@/types/inventory";

export const transactionClassOptions: TransactionClass[] = ["external", "internal"];

function normalizedStatus(item: InventoryItem) {
  return String(item.normalizedStatus ?? "").trim();
}

export function isInternalCustomerGroup(value: string | null | undefined) {
  return INTERNAL_CUSTOMER_GROUP_KEYS.has(normalizeCustomerGroup(value));
}

export function classifyTransaction(item: Pick<InventoryItem, "customerGroup">): TransactionClass {
  return isInternalCustomerGroup(item.customerGroup) ? "internal" : "external";
}

export function isSoldTransaction(item: InventoryItem) {
  return normalizedStatus(item) === "sold" || item.isSold;
}

export function isReservationTransaction(item: InventoryItem) {
  return ["reserve", "reservationForCompanies", "contract", "cession"].includes(normalizedStatus(item)) || item.isReserved;
}

export function withTransactionClassification<T extends InventoryItem>(item: T): T {
  return {
    ...item,
    transactionClass: classifyTransaction(item),
  };
}

export function transactionClassLabelKey(value: TransactionClass) {
  return `transaction.${value}`;
}

export function transactionClassLabel(value: TransactionClass) {
  return value === "internal" ? "Internal" : "External";
}

