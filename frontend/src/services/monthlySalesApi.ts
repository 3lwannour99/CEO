import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/apiClient";
import type {
  MonthlySalesAssignment,
  MonthlySalesAssignmentInput,
  MonthlySalesLocation,
  MonthlySalesLocationInput,
  MonthlySalesManagementBoard,
  MonthlySalesReportResponse,
} from "@/types/monthlySales";

export interface MonthlySalesReportQuery {
  dateFrom: string;
  dateTo: string;
  salesLocation?: string;
  salesman?: string;
  brands?: string;
  countries?: string;
  sourceIds?: string;
  branches?: string;
  warehouses?: string;
  models?: string;
  types?: string;
  customerGroups?: string;
  search?: string;
}

export function getPublicMonthlySalesReport(query: MonthlySalesReportQuery) {
  return apiGet<MonthlySalesReportResponse>("/public/monthly-sales-report", query);
}

export function getMonthlySalesManagementBoard(targetMonth: string, countries: string[] = []) {
  return apiGet<MonthlySalesManagementBoard>("/monthly-sales-targets", {
    targetMonth,
    countries: countries.join(",") || undefined,
  });
}

export function createMonthlySalesLocation(input: MonthlySalesLocationInput) {
  return apiPost<MonthlySalesLocation>("/monthly-sales-targets/locations", input);
}

export function updateMonthlySalesLocation(id: string, input: MonthlySalesLocationInput) {
  return apiPut<MonthlySalesLocation>(`/monthly-sales-targets/locations/${id}`, input);
}

export function setMonthlySalesLocationActive(id: string, isActive: boolean) {
  return apiPatch<MonthlySalesLocation>(`/monthly-sales-targets/locations/${id}/active`, {
    isActive,
  });
}

export function deleteMonthlySalesLocation(id: string) {
  return apiDelete<{ ok: boolean }>(`/monthly-sales-targets/locations/${id}`);
}

export function reorderMonthlySalesLocations(targetMonth: string, locationIds: string[]) {
  return apiPut<{ ok: boolean }>("/monthly-sales-targets/locations/reorder", {
    targetMonth,
    locationIds,
  });
}

export function assignMonthlySalesman(input: MonthlySalesAssignmentInput) {
  return apiPut<MonthlySalesAssignment>("/monthly-sales-targets/assignments", input);
}

export function unassignMonthlySalesman(id: string) {
  return apiDelete<{ ok: boolean }>(`/monthly-sales-targets/assignments/${id}`);
}
