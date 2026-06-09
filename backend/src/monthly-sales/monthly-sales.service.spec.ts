import { BadRequestException } from '@nestjs/common';
import {
    getSalesmanNamesForCountries,
    resolveReportRange,
} from './monthly-sales.service';

describe('resolveReportRange', () => {
    it('accepts inclusive dates within one calendar month', () => {
        expect(resolveReportRange('2026-06-01', '2026-06-30')).toEqual({
            dateFrom: '2026-06-01',
            dateTo: '2026-06-30',
            targetMonth: '2026-06',
        });
    });

    it('rejects reversed and cross-month ranges', () => {
        expect(() => resolveReportRange('2026-06-20', '2026-06-01')).toThrow(
            BadRequestException,
        );
        expect(() => resolveReportRange('2026-06-01', '2026-07-01')).toThrow(
            BadRequestException,
        );
    });

    it('rejects malformed and impossible dates', () => {
        expect(() => resolveReportRange('06/01/2026', '2026-06-30')).toThrow(
            BadRequestException,
        );
        expect(() => resolveReportRange('2026-02-30', '2026-02-30')).toThrow(
            BadRequestException,
        );
    });
});

describe('getSalesmanNamesForCountries', () => {
    const inventory = [
        { salesMan: 'Jordan Employee', sourceCountry: 'Jordan' },
        { salesMan: 'Saudi Employee', sourceCountry: 'Saudi Arabia' },
        { salesMan: 'Shared Employee', sourceCountry: 'Jordan' },
        { salesMan: 'Shared Employee', sourceCountry: 'Saudi Arabia' },
    ];

    it('returns only salesmen belonging to the selected countries', () => {
        expect([
            ...getSalesmanNamesForCountries(inventory, ['Jordan']),
        ]).toEqual(['jordan employee', 'shared employee']);
    });

    it('returns all salesmen when no country is selected', () => {
        expect(getSalesmanNamesForCountries(inventory, []).size).toBe(3);
    });
});
