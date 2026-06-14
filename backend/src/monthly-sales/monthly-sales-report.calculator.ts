export const MONTHLY_SALES_BRANDS = ['JAC', 'FORTHING', 'ROX'] as const;
export type MonthlySalesBrand = (typeof MONTHLY_SALES_BRANDS)[number];

const INTERNAL_CUSTOMER_GROUPS = new Set(
    [
        'Due From - Sister Companies',
        'Sister Company',
        'Syster Company',
        'Trade Debtors - Sis.Comp',
    ].map(normalizeText),
);

export interface MonthlySalesInventoryRow {
    sourceId: string;
    sourceName: string;
    sourceCountry: string;
    chassis: string;
    brand: string;
    model: string;
    type: string;
    branch: string;
    warehouse: string;
    salesMan: string;
    arInvoiceDate: string;
    customerGroup: string;
    normalizedStatus: string;
    isSold: boolean;
    isReserved: boolean;
}

export interface MonthlySalesLocationRecord {
    id: string;
    salesLocation: string;
    target: number;
    sortOrder?: number;
}

export interface MonthlySalesAssignmentRecord {
    id: string;
    salesmanName: string;
    normalizedSalesmanName: string;
    salesmanCode: string | null;
    allowedBrands: string;
    sortOrder?: number;
    group?: { id: string; name: string; sortOrder: number } | null;
    location: MonthlySalesLocationRecord;
}

export interface MonthlySalesReportFilters {
    dateFrom: string;
    dateTo: string;
    salesLocations: string[];
    salesmen: string[];
    brands: MonthlySalesBrand[];
    countries?: string[];
    sourceIds?: string[];
    branches?: string[];
    warehouses?: string[];
    models?: string[];
    types?: string[];
    customerGroups?: string[];
    search?: string;
}

export interface BrandCounts {
    invoiced: number;
    reservations: number;
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
    brands: Record<MonthlySalesBrand, BrandCounts>;
    invoicedTotal: number;
    target: number;
    achievementPercentage: number | null;
    isMapped: boolean;
}

export interface MonthlySalesReportTotal {
    salesLocation?: string;
    brands: Record<MonthlySalesBrand, BrandCounts>;
    invoicedTotal: number;
    target: number;
    achievementPercentage: number | null;
}

export function calculateMonthlySalesReport(
    inventory: MonthlySalesInventoryRow[],
    locations: MonthlySalesLocationRecord[],
    assignments: MonthlySalesAssignmentRecord[],
    filters: MonthlySalesReportFilters,
) {
    const assignmentBySalesman = new Map(
        assignments.map((assignment) => [
            assignment.normalizedSalesmanName,
            {
                ...assignment,
                allowedBrandList: parseAllowedBrands(assignment.allowedBrands),
            },
        ]),
    );
    const salesmanNames = new Map(
        assignments.map((assignment) => [
            assignment.normalizedSalesmanName,
            assignment.salesmanName.trim(),
        ]),
    );
    const reportingUnitsByLocation = new Map<string, Set<string>>();
    const assignmentCountByGroup = new Map<string, number>();
    for (const assignment of assignments) {
        const location = normalizeText(assignment.location.salesLocation);
        const units = reportingUnitsByLocation.get(location) ?? new Set();
        units.add(
            assignment.group
                ? `group:${assignment.group.id}`
                : `salesman:${assignment.id}`,
        );
        reportingUnitsByLocation.set(location, units);
        if (assignment.group) {
            assignmentCountByGroup.set(
                assignment.group.id,
                (assignmentCountByGroup.get(assignment.group.id) ?? 0) + 1,
            );
        }
    }
    const reportInventory = inventory.filter((item) =>
        itemMatchesNonDateFilters(item, filters),
    );

    const requestedLocations = new Set(
        filters.salesLocations.map(normalizeText),
    );
    const requestedSalesmen = new Set(
        filters.salesmen.map(normalizeSalesmanName),
    );
    const requestedBrands = new Set(filters.brands);
    const configuredLocations = locations.map((location) =>
        location.salesLocation.trim(),
    );
    const allOptions = {
        salesLocations: [...new Set(configuredLocations)],
        salesmen: [...salesmanNames.values()].sort(),
        brands: [...MONTHLY_SALES_BRANDS],
        countries: uniqueValues(inventory, (item) => item.sourceCountry),
        sources: uniqueOptions(
            inventory,
            (item) => item.sourceId,
            (item) => item.sourceName,
        ),
        branches: uniqueValues(inventory, (item) => item.branch),
        warehouses: uniqueValues(inventory, (item) => item.warehouse),
        models: uniqueValues(inventory, (item) => item.model),
        types: uniqueValues(inventory, (item) => item.type),
        customerGroups: uniqueValues(inventory, (item) => item.customerGroup),
    };
    const rows: MonthlySalesReportRow[] = [];

    for (const [normalizedSalesman, salesmanName] of salesmanNames) {
        const assignment = assignmentBySalesman.get(normalizedSalesman)!;
        const salesLocation = assignment.location.salesLocation.trim();
        const allowedBrands = assignment.allowedBrandList;

        if (
            requestedLocations.size > 0 &&
            !requestedLocations.has(normalizeText(salesLocation))
        ) {
            continue;
        }
        if (
            requestedSalesmen.size > 0 &&
            !requestedSalesmen.has(normalizedSalesman)
        ) {
            continue;
        }

        const brandCounts = emptyBrandCounts();
        const invoicedKeys = new Set<string>();
        const reservationKeys = new Set<string>();

        for (const item of reportInventory) {
            if (
                normalizeSalesmanName(item.salesMan) !== normalizedSalesman ||
                isInternalCustomerGroup(item.customerGroup)
            ) {
                continue;
            }

            const brand = normalizeBrand(item.brand);
            if (
                !brand ||
                !allowedBrands.includes(brand) ||
                !requestedBrands.has(brand)
            ) {
                continue;
            }

            const distinctKey = `${item.sourceId}|${item.chassis.trim().toLowerCase()}`;
            if (
                isInvoiced(item) &&
                dateInRange(
                    item.arInvoiceDate,
                    filters.dateFrom,
                    filters.dateTo,
                )
            ) {
                invoicedKeys.add(`${brand}|${distinctKey}`);
            }
            if (isOpenReservation(item)) {
                reservationKeys.add(`${brand}|${distinctKey}`);
            }
        }

        for (const key of invoicedKeys) {
            const brand = key.split('|', 1)[0] as MonthlySalesBrand;
            brandCounts[brand].invoiced += 1;
        }
        for (const key of reservationKeys) {
            const brand = key.split('|', 1)[0] as MonthlySalesBrand;
            brandCounts[brand].reservations += 1;
        }

        const invoicedTotal = sumInvoiced(brandCounts);
        const locationReportingUnitCount =
            reportingUnitsByLocation.get(normalizeText(salesLocation))?.size ??
            0;
        const reportingUnitTarget =
            locationReportingUnitCount > 0
                ? assignment.location.target / locationReportingUnitCount
                : 0;
        const groupAssignmentCount = assignment.group
            ? (assignmentCountByGroup.get(assignment.group.id) ?? 1)
            : 1;
        const target = reportingUnitTarget / groupAssignmentCount;
        const totalUnits = sumTotalUnits(brandCounts);
        rows.push({
            mappingId: assignment.id,
            salesmanName,
            salesmanCode: assignment.salesmanCode,
            salesLocation,
            groupName: assignment.group?.name.trim() || null,
            groupSortOrder: assignment.group?.sortOrder ?? null,
            sortOrder: assignment.sortOrder ?? 0,
            allowedBrands,
            brands: brandCounts,
            invoicedTotal,
            target,
            achievementPercentage:
                target > 0 ? (totalUnits / target) * 100 : null,
            isMapped: true,
        });
    }

    rows.sort(
        (left, right) =>
            left.salesLocation.localeCompare(right.salesLocation) ||
            (left.groupSortOrder ?? Number.MAX_SAFE_INTEGER) -
                (right.groupSortOrder ?? Number.MAX_SAFE_INTEGER) ||
            (left.groupName ?? '').localeCompare(right.groupName ?? '') ||
            left.sortOrder - right.sortOrder ||
            left.salesmanName.localeCompare(right.salesmanName),
    );

    const locationGroups = new Map<string, MonthlySalesReportRow[]>();
    for (const row of rows) {
        const group = locationGroups.get(row.salesLocation) ?? [];
        group.push(row);
        locationGroups.set(row.salesLocation, group);
    }

    const targetByLocation = new Map(
        locations.map((location) => [
            normalizeText(location.salesLocation),
            location.target,
        ]),
    );
    const visibleLocations = new Set(locationGroups.keys());
    if (requestedSalesmen.size === 0) {
        for (const salesLocation of configuredLocations) {
            if (
                requestedLocations.size === 0 ||
                requestedLocations.has(normalizeText(salesLocation))
            ) {
                visibleLocations.add(salesLocation);
            }
        }
    }
    const orderedVisibleLocations = [
        ...configuredLocations.filter((location) =>
            visibleLocations.has(location),
        ),
        ...[...visibleLocations].filter(
            (location) => !configuredLocations.includes(location),
        ),
    ];
    const locationTotals = orderedVisibleLocations.map((salesLocation) => {
        const group = locationGroups.get(salesLocation) ?? [];
        const target = targetByLocation.get(normalizeText(salesLocation)) ?? 0;
        return {
            salesLocation,
            ...sumRows(group, target),
        };
    });
    const grandTotal = sumTotals(locationTotals);

    return {
        rows,
        locationTotals,
        grandTotal,
        options: allOptions,
    };
}

export function normalizeSalesmanName(value: string | null | undefined) {
    return normalizeText(value);
}

export function normalizeBrand(
    value: string | null | undefined,
): MonthlySalesBrand | null {
    const normalized = normalizeText(value).replace(/[^a-z0-9]/g, '');
    if (normalized === 'jac') return 'JAC';
    if (normalized === 'for' || normalized === 'forthing') return 'FORTHING';
    if (normalized === 'rox') return 'ROX';
    return null;
}

export function parseAllowedBrands(value: string) {
    const brands = value
        .split(',')
        .map(normalizeBrand)
        .filter((brand): brand is MonthlySalesBrand => brand !== null);
    return [...new Set(brands)];
}

function itemMatchesNonDateFilters(
    item: MonthlySalesInventoryRow,
    filters: MonthlySalesReportFilters,
) {
    const search = normalizeText(filters.search);
    return (
        matchesFilter(item.sourceCountry, filters.countries ?? []) &&
        matchesFilter(item.sourceId, filters.sourceIds ?? []) &&
        matchesFilter(item.branch, filters.branches ?? []) &&
        matchesFilter(item.warehouse, filters.warehouses ?? []) &&
        matchesFilter(item.model, filters.models ?? []) &&
        matchesFilter(item.type, filters.types ?? []) &&
        matchesFilter(item.customerGroup, filters.customerGroups ?? []) &&
        (!search ||
            normalizeText(
                [
                    item.sourceName,
                    item.sourceCountry,
                    item.chassis,
                    item.brand,
                    item.model,
                    item.type,
                    item.branch,
                    item.warehouse,
                    item.salesMan,
                    item.customerGroup,
                ].join(' '),
            ).includes(search))
    );
}

function matchesFilter(value: string, selected: string[]) {
    if (selected.length === 0) return true;
    const normalized = normalizeText(value);
    return selected.some((item) => normalizeText(item) === normalized);
}

function uniqueValues(
    items: MonthlySalesInventoryRow[],
    selector: (item: MonthlySalesInventoryRow) => string,
) {
    return [
        ...new Set(
            items
                .map(selector)
                .map((value) => value.trim())
                .filter(Boolean),
        ),
    ].sort();
}

function uniqueOptions(
    items: MonthlySalesInventoryRow[],
    valueSelector: (item: MonthlySalesInventoryRow) => string,
    labelSelector: (item: MonthlySalesInventoryRow) => string,
) {
    const options = new Map<string, string>();
    for (const item of items) {
        const value = valueSelector(item).trim();
        if (value && !options.has(value)) {
            options.set(value, labelSelector(item).trim() || value);
        }
    }
    return [...options.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeText(value: string | null | undefined) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function isInternalCustomerGroup(value: string) {
    return INTERNAL_CUSTOMER_GROUPS.has(normalizeText(value));
}

function isInvoiced(item: MonthlySalesInventoryRow) {
    return (
        (item.isSold || normalizeText(item.normalizedStatus) === 'sold') &&
        Boolean(item.arInvoiceDate)
    );
}

function isOpenReservation(item: MonthlySalesInventoryRow) {
    const status = normalizeText(item.normalizedStatus);
    return (
        item.isReserved ||
        status === 'reserve' ||
        status === 'reserved' ||
        status === 'reservationforcompanies' ||
        status === 'contract' ||
        status === 'cession'
    );
}

function dateInRange(value: string, from: string, to: string) {
    const normalized = normalizeDate(value);
    return normalized !== null && normalized >= from && normalized <= to;
}

function normalizeDate(value: string) {
    const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
    const dayFirstMatch = value
        .trim()
        .match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dayFirstMatch) {
        return `${dayFirstMatch[3]}-${dayFirstMatch[2].padStart(2, '0')}-${dayFirstMatch[1].padStart(2, '0')}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0'),
    ].join('-');
}

function emptyBrandCounts(): Record<MonthlySalesBrand, BrandCounts> {
    return {
        JAC: { invoiced: 0, reservations: 0 },
        FORTHING: { invoiced: 0, reservations: 0 },
        ROX: { invoiced: 0, reservations: 0 },
    };
}

function sumInvoiced(brands: Record<MonthlySalesBrand, BrandCounts>) {
    return MONTHLY_SALES_BRANDS.reduce(
        (sum, brand) => sum + brands[brand].invoiced,
        0,
    );
}

function sumTotalUnits(brands: Record<MonthlySalesBrand, BrandCounts>) {
    return MONTHLY_SALES_BRANDS.reduce(
        (sum, brand) =>
            sum + brands[brand].invoiced + brands[brand].reservations,
        0,
    );
}

function sumRows(
    rows: MonthlySalesReportRow[],
    target = 0,
): MonthlySalesReportTotal {
    const brands = emptyBrandCounts();
    for (const row of rows) {
        for (const brand of MONTHLY_SALES_BRANDS) {
            brands[brand].invoiced += row.brands[brand].invoiced;
            brands[brand].reservations += row.brands[brand].reservations;
        }
    }
    const invoicedTotal = sumInvoiced(brands);
    const totalUnits = sumTotalUnits(brands);
    return {
        brands,
        invoicedTotal,
        target,
        achievementPercentage: target > 0 ? (totalUnits / target) * 100 : null,
    };
}

function sumTotals(totals: MonthlySalesReportTotal[]): MonthlySalesReportTotal {
    const brands = emptyBrandCounts();
    let target = 0;
    for (const total of totals) {
        target += total.target;
        for (const brand of MONTHLY_SALES_BRANDS) {
            brands[brand].invoiced += total.brands[brand].invoiced;
            brands[brand].reservations += total.brands[brand].reservations;
        }
    }
    const invoicedTotal = sumInvoiced(brands);
    const totalUnits = sumTotalUnits(brands);
    return {
        brands,
        invoicedTotal,
        target,
        achievementPercentage: target > 0 ? (totalUnits / target) * 100 : null,
    };
}
