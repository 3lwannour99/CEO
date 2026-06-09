import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { MonthlySalesReportQueryDto } from './dto/monthly-sales-report-query.dto';
import {
    MonthlySalesAssignmentDto,
    MonthlySalesLocationDto,
} from './dto/monthly-sales-target.dto';
import {
    calculateMonthlySalesReport,
    MONTHLY_SALES_BRANDS,
    normalizeBrand,
    normalizeSalesmanName,
} from './monthly-sales-report.calculator';

@Injectable()
export class MonthlySalesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inventoryService: InventoryService,
    ) {}

    async getPublicReport(query: MonthlySalesReportQueryDto) {
        const range = resolveReportRange(query.dateFrom, query.dateTo);
        const brands = parseRequestedBrands(query.brands);
        const [inventoryResponse, locations, assignments] = await Promise.all([
            this.inventoryService.findAll({}),
            this.prisma.monthlySalesLocation.findMany({
                where: { targetMonth: range.targetMonth, isActive: true },
                orderBy: { salesLocation: 'asc' },
            }),
            this.prisma.monthlySalesAssignment.findMany({
                where: {
                    targetMonth: range.targetMonth,
                    isActive: true,
                    location: { isActive: true },
                },
                include: { location: true },
                orderBy: { salesmanName: 'asc' },
            }),
        ]);

        return {
            targetMonth: range.targetMonth,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
            generatedAt: new Date().toISOString(),
            ...calculateMonthlySalesReport(
                inventoryResponse.data,
                locations,
                assignments,
                {
                    dateFrom: range.dateFrom,
                    dateTo: range.dateTo,
                    salesLocations: splitFilter(query.salesLocation),
                    salesmen: splitFilter(query.salesman),
                    brands,
                    countries: splitFilter(query.countries),
                    sourceIds: splitFilter(query.sourceIds),
                    branches: splitFilter(query.branches),
                    warehouses: splitFilter(query.warehouses),
                    models: splitFilter(query.models),
                    types: splitFilter(query.types),
                    customerGroups: splitFilter(query.customerGroups),
                    search: query.search?.trim() ?? '',
                },
            ),
        };
    }

    async getManagementBoard(targetMonth: string, countries: string[] = []) {
        validateTargetMonth(targetMonth);
        const [locations, assignments, inventoryResponse] = await Promise.all([
            this.prisma.monthlySalesLocation.findMany({
                where: { targetMonth },
                include: {
                    assignments: {
                        where: { isActive: true },
                        orderBy: { salesmanName: 'asc' },
                    },
                },
                orderBy: { salesLocation: 'asc' },
            }),
            this.prisma.monthlySalesAssignment.findMany({
                where: { targetMonth, isActive: true },
                select: { normalizedSalesmanName: true },
            }),
            this.inventoryService.findAll({}),
        ]);
        const countrySalesmen = getSalesmanNamesForCountries(
            inventoryResponse.data,
            countries,
        );
        const filterByCountry = countries.length > 0;
        const assignedNames = new Set(
            assignments.map((item) => item.normalizedSalesmanName),
        );
        return {
            targetMonth,
            locations: locations.map((location) => {
                const serialized = serializeLocation(location);
                return {
                    ...serialized,
                    assignments: filterByCountry
                        ? serialized.assignments.filter((assignment) =>
                              countrySalesmen.has(
                                  assignment.normalizedSalesmanName,
                              ),
                          )
                        : serialized.assignments,
                };
            }),
            unassignedSalesmen: [
                ...new Set(
                    inventoryResponse.data
                        .filter(
                            (item) =>
                                !filterByCountry ||
                                matchesSelectedCountry(
                                    item.sourceCountry,
                                    countries,
                                ),
                        )
                        .map((item) => item.salesMan.trim())
                        .filter(Boolean),
                ),
            ]
                .sort()
                .filter(
                    (name) => !assignedNames.has(normalizeSalesmanName(name)),
                )
                .map((salesmanName) => ({ salesmanName })),
        };
    }

    createLocation(dto: MonthlySalesLocationDto) {
        return this.prisma.monthlySalesLocation
            .create({ data: sanitizeLocation(dto) })
            .then(serializeLocation);
    }

    async updateLocation(id: string, dto: MonthlySalesLocationDto) {
        await this.requireLocation(id);
        return this.prisma.monthlySalesLocation
            .update({ where: { id }, data: sanitizeLocation(dto) })
            .then(serializeLocation);
    }

    async setLocationActive(id: string, isActive: boolean) {
        await this.requireLocation(id);
        return this.prisma.monthlySalesLocation
            .update({ where: { id }, data: { isActive } })
            .then(serializeLocation);
    }

    async deleteLocation(id: string) {
        await this.requireLocation(id);
        await this.prisma.$transaction([
            this.prisma.monthlySalesAssignment.deleteMany({
                where: { locationId: id },
            }),
            this.prisma.monthlySalesLocation.delete({ where: { id } }),
        ]);
        return { ok: true };
    }

    async assignSalesman(dto: MonthlySalesAssignmentDto) {
        validateTargetMonth(dto.targetMonth);
        const location = await this.requireLocation(dto.locationId);
        if (location.targetMonth !== dto.targetMonth) {
            throw new BadRequestException(
                'The location and assignment must belong to the same month.',
            );
        }
        const data = sanitizeAssignment(dto);
        return this.prisma.monthlySalesAssignment
            .upsert({
                where: {
                    targetMonth_normalizedSalesmanName: {
                        targetMonth: dto.targetMonth,
                        normalizedSalesmanName: data.normalizedSalesmanName,
                    },
                },
                create: data,
                update: {
                    locationId: data.locationId,
                    salesmanName: data.salesmanName,
                    salesmanCode: data.salesmanCode,
                    allowedBrands: data.allowedBrands,
                    isActive: true,
                },
            })
            .then(serializeAssignment);
    }

    async unassignSalesman(id: string) {
        const assignment = await this.prisma.monthlySalesAssignment.findUnique({
            where: { id },
        });
        if (!assignment) {
            throw new NotFoundException(
                'Monthly salesman assignment not found.',
            );
        }
        await this.prisma.monthlySalesAssignment.delete({ where: { id } });
        return { ok: true };
    }

    private async requireLocation(id: string) {
        const location = await this.prisma.monthlySalesLocation.findUnique({
            where: { id },
        });
        if (!location) {
            throw new NotFoundException('Monthly sales location not found.');
        }
        return location;
    }
}

export function getSalesmanNamesForCountries(
    inventory: Array<{ salesMan: string; sourceCountry: string }>,
    countries: string[],
) {
    return new Set(
        inventory
            .filter((item) =>
                matchesSelectedCountry(item.sourceCountry, countries),
            )
            .map((item) => normalizeSalesmanName(item.salesMan))
            .filter(Boolean),
    );
}

function matchesSelectedCountry(value: string, countries: string[]) {
    if (countries.length === 0) return true;
    const normalizedValue = normalizeText(value);
    return countries.some(
        (country) => normalizeText(country) === normalizedValue,
    );
}

function sanitizeLocation(dto: MonthlySalesLocationDto) {
    validateTargetMonth(dto.targetMonth);
    const salesLocation = dto.salesLocation.trim();
    if (!salesLocation) {
        throw new BadRequestException('Sales location is required.');
    }
    return {
        targetMonth: dto.targetMonth,
        salesLocation,
        normalizedLocation: normalizeText(salesLocation),
        target: dto.target,
        isActive: dto.isActive ?? true,
    };
}

function sanitizeAssignment(dto: MonthlySalesAssignmentDto) {
    const salesmanName = dto.salesmanName.trim();
    if (!salesmanName) {
        throw new BadRequestException('Salesman name is required.');
    }
    const allowedBrands = [
        ...new Set(dto.allowedBrands.map(normalizeBrand).filter(Boolean)),
    ];
    if (allowedBrands.length === 0) {
        throw new BadRequestException(
            'At least one supported brand is required.',
        );
    }
    return {
        targetMonth: dto.targetMonth,
        salesmanName,
        normalizedSalesmanName: normalizeSalesmanName(salesmanName),
        salesmanCode: dto.salesmanCode?.trim() || null,
        locationId: dto.locationId,
        allowedBrands: allowedBrands.join(','),
        isActive: true,
    };
}

function serializeLocation<T extends object>(
    location: T & {
        assignments?: Array<{ allowedBrands: string }>;
    },
) {
    return {
        ...location,
        assignments: location.assignments?.map(serializeAssignment) ?? [],
    };
}

function serializeAssignment<T extends { allowedBrands: string }>(
    assignment: T,
) {
    return {
        ...assignment,
        allowedBrands: assignment.allowedBrands.split(',').filter(Boolean),
    };
}

export function resolveReportRange(dateFrom?: string, dateTo?: string) {
    const defaultRange = currentAmmanMonth();
    const from = dateFrom || defaultRange.dateFrom;
    const to = dateTo || defaultRange.dateTo;
    validateDate(from, 'dateFrom');
    validateDate(to, 'dateTo');
    if (from > to) {
        throw new BadRequestException('dateFrom must be before dateTo.');
    }
    if (from.slice(0, 7) !== to.slice(0, 7)) {
        throw new BadRequestException(
            'The monthly sales report date range must stay within one calendar month.',
        );
    }
    return { dateFrom: from, dateTo: to, targetMonth: from.slice(0, 7) };
}

function currentAmmanMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Amman',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
    );
    const year = Number(values.year);
    const month = Number(values.month);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return {
        dateFrom: `${values.year}-${values.month}-01`,
        dateTo: `${values.year}-${values.month}-${String(lastDay).padStart(2, '0')}`,
    };
}

function validateDate(value: string, field: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException(`${field} must use YYYY-MM-DD.`);
    }
    const date = new Date(`${value}T00:00:00Z`);
    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        throw new BadRequestException(`${field} is not a valid date.`);
    }
}

function validateTargetMonth(value: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
        throw new BadRequestException('targetMonth must use YYYY-MM.');
    }
}

function parseRequestedBrands(value?: string) {
    if (!value) return [...MONTHLY_SALES_BRANDS];
    const brands = splitFilter(value)
        .map(normalizeBrand)
        .filter((brand): brand is (typeof MONTHLY_SALES_BRANDS)[number] =>
            Boolean(brand),
        );
    if (brands.length === 0) {
        throw new BadRequestException('No supported brands were selected.');
    }
    return [...new Set(brands)];
}

function splitFilter(value?: string) {
    return String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
