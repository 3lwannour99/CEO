export type DateField =
  | "all"
  | "grpoDate"
  | "arInvoiceDate"
  | "apInvoiceDate"
  | "createDate"
  | "contractDate"
  | "reserveDate"
  | "estimatedArrival";

export type DatePreset =
  | ""
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";

export interface InventoryFilters {
  sourceIds: string[];
  countries: string[];
  brands: string[];
  models: string[];
  modelYears: string[];
  types: string[];
  exteriorColors: string[];
  interiorColors: string[];
  wheels: string[];
  branches: string[];
  warehouses: string[];
  statuses: string[];
  movementCategories: string[];
  readyStatuses: string[];
  customerGroups: string[];
  salesmen: string[];
  search: string;
  dateField: DateField;
  fromDate?: string;
  toDate?: string;
  exactDate?: string;
  datePreset?: DatePreset;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultInventoryFilters(): InventoryFilters {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    sourceIds: [],
    countries: [],
    brands: [],
    models: [],
    modelYears: [],
    types: [],
    exteriorColors: [],
    interiorColors: [],
    wheels: [],
    branches: [],
    warehouses: [],
    statuses: [],
    movementCategories: [],
    readyStatuses: [],
    customerGroups: [],
    salesmen: [],
    search: "",
    dateField: "all",
    fromDate: toDateInputValue(firstDay),
    toDate: toDateInputValue(lastDay),
    exactDate: undefined,
    datePreset: "thisMonth",
  };
}

export const emptyInventoryFilters: InventoryFilters = createDefaultInventoryFilters();
