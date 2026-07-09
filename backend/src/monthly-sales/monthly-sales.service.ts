import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { MonthlySalesReportQueryDto } from './dto/monthly-sales-report-query.dto';
import {
    CopyMonthlySalesTargetsDto,
    MonthlySalesAssignmentDto,
    MonthlySalesGroupDto,
    MonthlySalesLocationDto,
    ReorderMonthlySalesAssignmentsDto,
    ReorderMonthlySalesLocationsDto,
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
                orderBy: [{ sortOrder: 'asc' }, { salesLocation: 'asc' }],
            }),
            this.prisma.monthlySalesAssignment.findMany({
                where: {
                    targetMonth: range.targetMonth,
                    isActive: true,
                    location: { isActive: true },
                },
                include: { location: true, group: true },
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
                        orderBy: [
                            { groupId: 'asc' },
                            { sortOrder: 'asc' },
                            { salesmanName: 'asc' },
                        ],
                    },
                    groups: {
                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    },
                },
                orderBy: [{ sortOrder: 'asc' }, { salesLocation: 'asc' }],
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

    async copyTargets(dto: CopyMonthlySalesTargetsDto) {
        validateTargetMonth(dto.sourceMonth);
        validateTargetMonth(dto.targetMonth);
        if (dto.sourceMonth === dto.targetMonth) {
            throw new BadRequestException(
                'Source month and target month must be different.',
            );
        }

        const [sourceLocations, targetLocationCount] = await Promise.all([
            this.prisma.monthlySalesLocation.findMany({
                where: { targetMonth: dto.sourceMonth },
                include: {
                    groups: {
                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    },
                    assignments: {
                        orderBy: [
                            { groupId: 'asc' },
                            { sortOrder: 'asc' },
                            { salesmanName: 'asc' },
                        ],
                    },
                },
                orderBy: [{ sortOrder: 'asc' }, { salesLocation: 'asc' }],
            }),
            this.prisma.monthlySalesLocation.count({
                where: { targetMonth: dto.targetMonth },
            }),
        ]);

        if (sourceLocations.length === 0) {
            throw new BadRequestException(
                'No sales target mappings exist for the source month.',
            );
        }
        if (targetLocationCount > 0 && !dto.overwrite) {
            throw new BadRequestException(
                'The target month already has sales target mappings. Enable replace existing mappings to copy into it.',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            if (dto.overwrite) {
                await tx.monthlySalesAssignment.deleteMany({
                    where: { targetMonth: dto.targetMonth },
                });
                await tx.monthlySalesLocation.deleteMany({
                    where: { targetMonth: dto.targetMonth },
                });
            }

            const locationIds = new Map<string, string>();
            const groupIds = new Map<string, string>();
            let groupCount = 0;
            let assignmentCount = 0;

            for (const sourceLocation of sourceLocations) {
                const copiedLocation = await tx.monthlySalesLocation.create({
                    data: {
                        targetMonth: dto.targetMonth,
                        salesLocation: sourceLocation.salesLocation,
                        normalizedLocation: sourceLocation.normalizedLocation,
                        target: sourceLocation.target,
                        isActive: sourceLocation.isActive,
                        sortOrder: sourceLocation.sortOrder,
                    },
                });
                locationIds.set(sourceLocation.id, copiedLocation.id);

                for (const sourceGroup of sourceLocation.groups) {
                    const copiedGroup = await tx.monthlySalesGroup.create({
                        data: {
                            locationId: copiedLocation.id,
                            name: sourceGroup.name,
                            normalizedName: sourceGroup.normalizedName,
                            sortOrder: sourceGroup.sortOrder,
                        },
                    });
                    groupIds.set(sourceGroup.id, copiedGroup.id);
                    groupCount += 1;
                }
            }

            for (const sourceLocation of sourceLocations) {
                const locationId = locationIds.get(sourceLocation.id);
                if (!locationId) continue;
                for (const sourceAssignment of sourceLocation.assignments) {
                    await tx.monthlySalesAssignment.create({
                        data: {
                            targetMonth: dto.targetMonth,
                            salesmanName: sourceAssignment.salesmanName,
                            normalizedSalesmanName:
                                sourceAssignment.normalizedSalesmanName,
                            salesmanCode: sourceAssignment.salesmanCode,
                            allowedBrands: sourceAssignment.allowedBrands,
                            isActive: sourceAssignment.isActive,
                            sortOrder: sourceAssignment.sortOrder,
                            locationId,
                            groupId: sourceAssignment.groupId
                                ? (groupIds.get(sourceAssignment.groupId) ??
                                  null)
                                : null,
                        },
                    });
                    assignmentCount += 1;
                }
            }

            return {
                ok: true,
                locations: sourceLocations.length,
                groups: groupCount,
                assignments: assignmentCount,
            };
        });
    }

    async createLocation(dto: MonthlySalesLocationDto) {
        const location = sanitizeLocation(dto);
        const lastLocation = await this.prisma.monthlySalesLocation.findFirst({
            where: { targetMonth: location.targetMonth },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });
        return this.prisma.monthlySalesLocation
            .create({
                data: {
                    ...location,
                    sortOrder: (lastLocation?.sortOrder ?? -1) + 1,
                },
            })
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

    async createGroup(dto: MonthlySalesGroupDto) {
        await this.requireLocation(dto.locationId);
        const group = sanitizeGroup(dto);
        const lastGroup = await this.prisma.monthlySalesGroup.findFirst({
            where: { locationId: dto.locationId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });
        return this.prisma.monthlySalesGroup.create({
            data: {
                ...group,
                sortOrder: (lastGroup?.sortOrder ?? -1) + 1,
            },
        });
    }

    async updateGroup(id: string, dto: MonthlySalesGroupDto) {
        const existing = await this.requireGroup(id);
        if (existing.locationId !== dto.locationId) {
            throw new BadRequestException(
                'A group cannot be moved to another sales location.',
            );
        }
        return this.prisma.monthlySalesGroup.update({
            where: { id },
            data: sanitizeGroup(dto),
        });
    }

    async deleteGroup(id: string) {
        await this.requireGroup(id);
        await this.prisma.monthlySalesGroup.delete({ where: { id } });
        return { ok: true };
    }

    async reorderLocations(dto: ReorderMonthlySalesLocationsDto) {
        validateTargetMonth(dto.targetMonth);
        const locationIds = [...new Set(dto.locationIds)];
        if (locationIds.length !== dto.locationIds.length) {
            throw new BadRequestException(
                'Location order cannot contain duplicate IDs.',
            );
        }
        const locations = await this.prisma.monthlySalesLocation.findMany({
            where: { targetMonth: dto.targetMonth },
            select: { id: true },
        });
        if (
            locations.length !== locationIds.length ||
            locations.some((location) => !locationIds.includes(location.id))
        ) {
            throw new BadRequestException(
                'Location order must contain every location for the selected month.',
            );
        }
        await this.prisma.$transaction(
            locationIds.map((id, sortOrder) =>
                this.prisma.monthlySalesLocation.update({
                    where: { id },
                    data: { sortOrder },
                }),
            ),
        );
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
        if (dto.groupId) {
            const group = await this.requireGroup(dto.groupId);
            if (group.locationId !== dto.locationId) {
                throw new BadRequestException(
                    'The selected group must belong to the selected location.',
                );
            }
        }
        const data = sanitizeAssignment(dto);
        const existing = await this.prisma.monthlySalesAssignment.findUnique({
            where: {
                targetMonth_normalizedSalesmanName: {
                    targetMonth: dto.targetMonth,
                    normalizedSalesmanName: data.normalizedSalesmanName,
                },
            },
        });
        const moved =
            !existing ||
            existing.locationId !== data.locationId ||
            existing.groupId !== data.groupId;
        const sortOrder = moved
            ? await this.nextAssignmentSortOrder(data.locationId, data.groupId)
            : existing.sortOrder;
        return this.prisma.monthlySalesAssignment
            .upsert({
                where: {
                    targetMonth_normalizedSalesmanName: {
                        targetMonth: dto.targetMonth,
                        normalizedSalesmanName: data.normalizedSalesmanName,
                    },
                },
                create: { ...data, sortOrder },
                update: {
                    locationId: data.locationId,
                    groupId: data.groupId,
                    salesmanName: data.salesmanName,
                    salesmanCode: data.salesmanCode,
                    allowedBrands: data.allowedBrands,
                    sortOrder,
                    isActive: true,
                },
            })
            .then(serializeAssignment);
    }

    async reorderAssignments(dto: ReorderMonthlySalesAssignmentsDto) {
        await this.requireLocation(dto.locationId);
        const groupId = dto.groupId?.trim() || null;
        if (groupId) {
            const group = await this.requireGroup(groupId);
            if (group.locationId !== dto.locationId) {
                throw new BadRequestException(
                    'The selected group must belong to the selected location.',
                );
            }
        }
        const assignmentIds = [...new Set(dto.assignmentIds)];
        if (assignmentIds.length !== dto.assignmentIds.length) {
            throw new BadRequestException(
                'Assignment order cannot contain duplicate IDs.',
            );
        }
        const assignments = await this.prisma.monthlySalesAssignment.findMany({
            where: {
                locationId: dto.locationId,
                groupId,
                isActive: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { salesmanName: 'asc' }],
            select: { id: true },
        });
        const existingIds = new Set(
            assignments.map((assignment) => assignment.id),
        );
        if (assignmentIds.some((id) => !existingIds.has(id))) {
            throw new BadRequestException(
                'Assignment order contains a salesman outside the selected group.',
            );
        }
        const selectedIds = new Set(assignmentIds);
        let selectedIndex = 0;
        const orderedIds = assignments.map((assignment) =>
            selectedIds.has(assignment.id)
                ? assignmentIds[selectedIndex++]
                : assignment.id,
        );
        await this.prisma.$transaction(
            orderedIds.map((id, sortOrder) =>
                this.prisma.monthlySalesAssignment.update({
                    where: { id },
                    data: { sortOrder },
                }),
            ),
        );
        return { ok: true };
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

    private async requireGroup(id: string) {
        const group = await this.prisma.monthlySalesGroup.findUnique({
            where: { id },
        });
        if (!group) {
            throw new NotFoundException('Monthly sales group not found.');
        }
        return group;
    }

    private async nextAssignmentSortOrder(
        locationId: string,
        groupId: string | null,
    ) {
        const lastAssignment =
            await this.prisma.monthlySalesAssignment.findFirst({
                where: { locationId, groupId, isActive: true },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
        return (lastAssignment?.sortOrder ?? -1) + 1;
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
        groupId: dto.groupId?.trim() || null,
        allowedBrands: allowedBrands.join(','),
        isActive: true,
    };
}

function sanitizeGroup(dto: MonthlySalesGroupDto) {
    const name = dto.name.trim();
    if (!name) {
        throw new BadRequestException('Group name is required.');
    }
    return {
        locationId: dto.locationId,
        name,
        normalizedName: normalizeText(name),
    };
}

function serializeLocation<T extends object>(
    location: T & {
        assignments?: Array<{ allowedBrands: string }>;
        groups?: object[];
    },
) {
    return {
        ...location,
        assignments: location.assignments?.map(serializeAssignment) ?? [],
        groups: location.groups ?? [],
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
    const brands = value ? parseBrandList(value) : [...MONTHLY_SALES_BRANDS];
    if (brands.length === 0) {
        throw new BadRequestException('No supported brands were selected.');
    }
    return [...new Set(brands)];
}

function parseBrandList(value?: string) {
    return splitFilter(value)
        .map(normalizeBrand)
        .filter((brand): brand is (typeof MONTHLY_SALES_BRANDS)[number] =>
            Boolean(brand),
        );
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
