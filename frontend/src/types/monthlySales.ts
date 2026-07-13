export type MonthlySalesBrand = "JAC" | "FORTHING" | "ROX";

export interface MonthlySalesBrandCounts {
  invoiced: number;
  reservations: number;
  target: number | null;
}

export interface MonthlySalesReportRow {
  mappingId: string | null;
  salesmanName: string;
  salesmanCode: string | null;
  salesLocation: string;
  groupName: string | null;
  groupSortOrder: number | null;
  sortOrder: number;
  allowedBrands: MonthlySalesBrand[];
  brands: Record<MonthlySalesBrand, MonthlySalesBrandCounts>;
  invoicedTotal: number;
  reservedTotal: number;
  target: number;
  achievementPercentage: number | null;
  isMapped: boolean;
}

export interface MonthlySalesReportTotal {
  salesLocation?: string;
  brands: Record<MonthlySalesBrand, MonthlySalesBrandCounts>;
  invoicedTotal: number;
  reservedTotal: number;
  target: number;
  achievementPercentage: number | null;
}

export interface MonthlySalesReportResponse {
  targetMonth: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  rows: MonthlySalesReportRow[];
  locationTotals: MonthlySalesReportTotal[];
  grandTotal: MonthlySalesReportTotal;
  options: {
    salesLocations: string[];
    salesmen: string[];
    brands: MonthlySalesBrand[];
    countries: string[];
    sources: Array<{ value: string; label: string }>;
    branches: string[];
    warehouses: string[];
    models: string[];
    types: string[];
    customerGroups: string[];
    statuses: string[];
  };
}

export interface MonthlySalesAssignment {
  id: string;
  targetMonth: string;
  salesmanName: string;
  normalizedSalesmanName: string;
  salesmanCode: string | null;
  locationId: string;
  groupId: string | null;
  sortOrder: number;
  allowedBrands: MonthlySalesBrand[];
  isActive: boolean;
}

export interface MonthlySalesGroup {
  id: string;
  locationId: string;
  name: string;
  normalizedName: string;
  sortOrder: number;
}

export interface MonthlySalesLocation {
  id: string;
  targetMonth: string;
  salesLocation: string;
  normalizedLocation: string;
  target: number;
  jacTarget: number | null;
  forthingTarget: number | null;
  roxTarget: number | null;
  isActive: boolean;
  sortOrder: number;
  assignments: MonthlySalesAssignment[];
  groups: MonthlySalesGroup[];
}

export interface MonthlySalesManagementBoard {
  targetMonth: string;
  locations: MonthlySalesLocation[];
  unassignedSalesmen: Array<{ salesmanName: string }>;
}

export interface MonthlySalesLocationInput {
  targetMonth: string;
  salesLocation: string;
  target: number;
  jacTarget?: number | null;
  forthingTarget?: number | null;
  roxTarget?: number | null;
  isActive?: boolean;
}

export interface MonthlySalesAssignmentInput {
  targetMonth: string;
  salesmanName: string;
  salesmanCode?: string;
  locationId: string;
  groupId?: string;
  allowedBrands: MonthlySalesBrand[];
}

export interface MonthlySalesGroupInput {
  locationId: string;
  name: string;
}

export interface MonthlySalesAssignmentOrderInput {
  locationId: string;
  groupId?: string;
  assignmentIds: string[];
}

export interface CopyMonthlySalesTargetsInput {
  sourceMonth: string;
  targetMonth: string;
  overwrite?: boolean;
}

export interface CopyMonthlySalesTargetsResult {
  ok: boolean;
  locations: number;
  groups: number;
  assignments: number;
}
