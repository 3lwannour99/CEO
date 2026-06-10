import {
    calculateMonthlySalesReport,
    type MonthlySalesAssignmentRecord,
    type MonthlySalesInventoryRow,
    type MonthlySalesLocationRecord,
} from './monthly-sales-report.calculator';

const location: MonthlySalesLocationRecord = {
    id: 'location-1',
    salesLocation: 'Amman',
    target: 4,
};

const assignment: MonthlySalesAssignmentRecord = {
    id: 'assignment-1',
    salesmanName: 'Ahmad Saleh',
    normalizedSalesmanName: 'ahmad saleh',
    salesmanCode: null,
    allowedBrands: 'JAC,FORTHING,ROX',
    location,
};

function row(
    patch: Partial<MonthlySalesInventoryRow> = {},
): MonthlySalesInventoryRow {
    return {
        sourceId: 'source-1',
        sourceName: 'Company One',
        sourceCountry: 'Jordan',
        chassis: 'VIN-1',
        brand: 'JAC',
        model: 'JS4',
        type: 'SUV',
        branch: 'Amman Branch',
        warehouse: 'Main Warehouse',
        salesMan: 'Ahmad Saleh',
        arInvoiceDate: '2026-06-10',
        customerGroup: 'Retail',
        normalizedStatus: 'sold',
        isSold: true,
        isReserved: false,
        ...patch,
    };
}

function calculate(
    inventory: MonthlySalesInventoryRow[],
    filters: Partial<{
        dateFrom: string;
        dateTo: string;
        salesLocations: string[];
        salesmen: string[];
        brands: Array<'JAC' | 'FORTHING' | 'ROX'>;
        countries: string[];
    }> = {},
) {
    return calculateMonthlySalesReport(inventory, [location], [assignment], {
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
        salesLocations: [],
        salesmen: [],
        brands: ['JAC', 'FORTHING', 'ROX'],
        ...filters,
    });
}

describe('calculateMonthlySalesReport', () => {
    it('filters invoices by invoice date but leaves open reservations unfiltered', () => {
        const report = calculate([
            row({ chassis: 'VIN-IN', arInvoiceDate: '2026-06-01' }),
            row({ chassis: 'VIN-OUT', arInvoiceDate: '2026-05-31' }),
            row({
                chassis: 'VIN-RES',
                arInvoiceDate: '2025-01-01',
                normalizedStatus: 'reserve',
                isSold: false,
                isReserved: true,
            }),
        ]);

        expect(report.rows[0].brands.JAC.invoiced).toBe(1);
        expect(report.rows[0].brands.JAC.reservations).toBe(1);
        expect(report.rows[0].target).toBe(4);
        expect(report.rows[0].achievementPercentage).toBe(50);
    });

    it('counts reserved, company reservation, contract, and cession as reservations', () => {
        const report = calculate(
            ['reserved', 'reservationForCompanies', 'contract', 'cession'].map(
                (normalizedStatus, index) =>
                    row({
                        chassis: `VIN-RESERVATION-${index}`,
                        arInvoiceDate: '',
                        normalizedStatus,
                        isSold: false,
                        isReserved: false,
                    }),
            ),
        );

        expect(report.rows[0].brands.JAC.reservations).toBe(4);
        expect(report.rows[0].achievementPercentage).toBe(100);
    });

    it('counts distinct source and chassis combinations', () => {
        const report = calculate([
            row(),
            row({ arInvoiceDate: '10/06/2026' }),
            row({ sourceId: 'source-2' }),
        ]);

        expect(report.rows[0].invoicedTotal).toBe(2);
    });

    it('excludes internal transactions and disallowed brands', () => {
        const report = calculateMonthlySalesReport(
            [
                row({ chassis: 'VIN-INT', customerGroup: 'Sister Company' }),
                row({ chassis: 'VIN-ROX', brand: 'ROX' }),
                row({ chassis: 'VIN-JAC' }),
            ],
            [location],
            [{ ...assignment, allowedBrands: 'JAC' }],
            {
                dateFrom: '2026-06-01',
                dateTo: '2026-06-30',
                salesLocations: [],
                salesmen: [],
                brands: ['JAC', 'FORTHING', 'ROX'],
            },
        );

        expect(report.rows[0].invoicedTotal).toBe(1);
    });

    it('keeps the full location target when filtering by brand', () => {
        const report = calculate(
            [row(), row({ chassis: 'VIN-ROX', brand: 'ROX' })],
            { brands: ['JAC'] },
        );

        expect(report.locationTotals[0].target).toBe(4);
        expect(report.locationTotals[0].achievementPercentage).toBe(25);
    });

    it('calculates achievement from invoices and reservations', () => {
        const report = calculate([
            row({ chassis: 'VIN-SOLD' }),
            row({
                chassis: 'VIN-RESERVED',
                arInvoiceDate: '',
                normalizedStatus: 'reserve',
                isSold: false,
                isReserved: true,
            }),
        ]);

        expect(report.locationTotals[0].invoicedTotal).toBe(1);
        expect(report.locationTotals[0].achievementPercentage).toBe(50);
        expect(report.grandTotal.achievementPercentage).toBe(50);
    });

    it('excludes salesmen who are not assigned to a location', () => {
        const report = calculateMonthlySalesReport(
            [row({ salesMan: 'Unmapped User' })],
            [],
            [],
            {
                dateFrom: '2026-06-01',
                dateTo: '2026-06-30',
                salesLocations: [],
                salesmen: [],
                brands: ['JAC', 'FORTHING', 'ROX'],
            },
        );

        expect(report.rows).toHaveLength(0);
        expect(report.options.salesmen).toHaveLength(0);
        expect(report.options.salesLocations).toHaveLength(0);
        expect(report.grandTotal.target).toBe(0);
        expect(report.grandTotal.achievementPercentage).toBeNull();
    });

    it('counts a location target once across multiple salesmen', () => {
        const secondAssignment: MonthlySalesAssignmentRecord = {
            ...assignment,
            id: 'assignment-2',
            salesmanName: 'Sara Ali',
            normalizedSalesmanName: 'sara ali',
        };
        const report = calculateMonthlySalesReport(
            [
                row(),
                row({ chassis: 'VIN-2', salesMan: 'Sara Ali', brand: 'ROX' }),
            ],
            [location],
            [assignment, secondAssignment],
            {
                dateFrom: '2026-06-01',
                dateTo: '2026-06-30',
                salesLocations: ['Amman'],
                salesmen: [],
                brands: ['JAC', 'FORTHING', 'ROX'],
            },
        );

        expect(report.rows).toHaveLength(2);
        expect(report.rows.map((item) => item.target)).toEqual([2, 2]);
        expect(report.rows.map((item) => item.achievementPercentage)).toEqual([
            50, 50,
        ]);
        expect(report.locationTotals[0].invoicedTotal).toBe(2);
        expect(report.locationTotals[0].target).toBe(4);
        expect(report.grandTotal.target).toBe(4);
    });

    it('includes an active location target even when no salesman is assigned', () => {
        const report = calculateMonthlySalesReport([], [location], [], {
            dateFrom: '2026-06-01',
            dateTo: '2026-06-30',
            salesLocations: [],
            salesmen: [],
            brands: ['JAC', 'FORTHING', 'ROX'],
        });

        expect(report.rows).toHaveLength(0);
        expect(report.locationTotals[0].salesLocation).toBe('Amman');
        expect(report.locationTotals[0].target).toBe(4);
        expect(report.grandTotal.target).toBe(4);
    });

    it('keeps the configured sales-location order in report options and totals', () => {
        const firstLocation = {
            ...location,
            id: 'location-first',
            salesLocation: 'Zarqa',
            sortOrder: 0,
        };
        const secondLocation = {
            ...location,
            id: 'location-second',
            salesLocation: 'Amman',
            sortOrder: 1,
        };
        const report = calculateMonthlySalesReport(
            [],
            [firstLocation, secondLocation],
            [],
            {
                dateFrom: '2026-06-01',
                dateTo: '2026-06-30',
                salesLocations: [],
                salesmen: [],
                brands: ['JAC', 'FORTHING', 'ROX'],
            },
        );

        expect(report.options.salesLocations).toEqual(['Zarqa', 'Amman']);
        expect(
            report.locationTotals.map((total) => total.salesLocation),
        ).toEqual(['Zarqa', 'Amman']);
    });

    it('applies country filters to invoices and reservations without date-filtering reservations', () => {
        const report = calculate(
            [
                row({ chassis: 'VIN-JO-SOLD', sourceCountry: 'Jordan' }),
                row({
                    chassis: 'VIN-SA-SOLD',
                    sourceCountry: 'Saudi Arabia',
                }),
                row({
                    chassis: 'VIN-JO-RES',
                    sourceCountry: 'Jordan',
                    arInvoiceDate: '2025-01-01',
                    normalizedStatus: 'reserve',
                    isSold: false,
                    isReserved: true,
                }),
                row({
                    chassis: 'VIN-SA-RES',
                    sourceCountry: 'Saudi Arabia',
                    normalizedStatus: 'reserve',
                    isSold: false,
                    isReserved: true,
                }),
            ],
            { countries: ['Jordan'] },
        );

        expect(report.rows[0].brands.JAC.invoiced).toBe(1);
        expect(report.rows[0].brands.JAC.reservations).toBe(1);
    });
});
