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

export const emptyInventoryFilters: InventoryFilters = {
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
  fromDate: "",
  toDate: "",
  exactDate: "",
  datePreset: "",
};
