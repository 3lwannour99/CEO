export type MonthlySalesBrand = "JAC" | "FORTHING" | "ROX";

export interface MonthlySalesBrandCounts {
  invoiced: number;
  reservations: number;
}

export interface MonthlySalesReportRow {
  mappingId: string | null;
  salesmanName: string;
  salesmanCode: string | null;
  salesLocation: string;
  allowedBrands: MonthlySalesBrand[];
  brands: Record<MonthlySalesBrand, MonthlySalesBrandCounts>;
  invoicedTotal: number;
  target: number;
  achievementPercentage: number | null;
  isMapped: boolean;
}

export interface MonthlySalesReportTotal {
  salesLocation?: string;
  brands: Record<MonthlySalesBrand, MonthlySalesBrandCounts>;
  invoicedTotal: number;
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
  };
}

export interface MonthlySalesAssignment {
  id: string;
  targetMonth: string;
  salesmanName: string;
  normalizedSalesmanName: string;
  salesmanCode: string | null;
  locationId: string;
  allowedBrands: MonthlySalesBrand[];
  isActive: boolean;
}

export interface MonthlySalesLocation {
  id: string;
  targetMonth: string;
  salesLocation: string;
  normalizedLocation: string;
  target: number;
  isActive: boolean;
  sortOrder: number;
  assignments: MonthlySalesAssignment[];
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
  isActive?: boolean;
}

export interface MonthlySalesAssignmentInput {
  targetMonth: string;
  salesmanName: string;
  salesmanCode?: string;
  locationId: string;
  allowedBrands: MonthlySalesBrand[];
}
