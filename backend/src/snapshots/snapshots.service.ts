import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { groupBy } from '../common/calculations/grouping';
import { InventoryItem } from '../integrations/counterscreen/counterscreen.types';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';

const SAR_TO_JOD = 0.188;
const SAR_TO_USD = 0.2667;

type SnapshotQuery = Record<string, string | undefined>;

@Injectable()
export class SnapshotsService {
    constructor(
        private readonly inventoryService: InventoryService,
        private readonly prisma: PrismaService,
    ) {}

    async runSnapshot(
        body: { filtered?: boolean; filters?: SnapshotQuery } = {},
    ) {
        const filters = cleanSnapshotFilters(body.filters ?? {});
        const filtered = Boolean(
            body.filtered && Object.keys(filters).length > 0,
        );
        const response = await this.inventoryService.findAll(
            filtered ? toInventoryQuery(filters) : {},
        );
        const snapshotDate = new Date();
        const totals = buildTotals(response.data);
        const items = buildSnapshotItems(response.data);

        return this.prisma.inventorySnapshot.create({
            data: {
                snapshotDate,
                sourceId: oneValue(response.data, (item) => item.sourceId),
                sourceName: filtered
                    ? 'Filtered Snapshot'
                    : (oneValue(response.data, (item) => item.sourceName) ??
                      'All Sources'),
                isFiltered: filtered,
                filtersJson: filtered ? filters : undefined,
                scopeLabel: filtered
                    ? summarizeFilters(filters)
                    : 'Full inventory',
                ...totals,
                items: { create: items },
            },
            include: { items: true },
        });
    }

    async findAll(query: SnapshotQuery = {}) {
        const snapshots = await this.prisma.inventorySnapshot.findMany({
            where: snapshotWhere(query),
            include: { items: { where: snapshotItemWhere(query) } },
            orderBy: { snapshotDate: 'desc' },
            take: 90,
        });

        return snapshots.map((snapshot) => summarizeSnapshot(snapshot, query));
    }

    async findOne(id: string, query: SnapshotQuery = {}) {
        const snapshot = await this.prisma.inventorySnapshot.findUnique({
            where: { id },
            include: { items: { where: snapshotItemWhere(query) } },
        });

        if (!snapshot) {
            throw new NotFoundException('Snapshot not found.');
        }

        const summary = summarizeSnapshot(snapshot, query);
        const items = snapshot.items;

        return {
            ...summary,
            items,
            breakdowns: {
                bySource: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.sourceName || item.sourceId || 'Unknown',
                ),
                byBrand: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.brand,
                ),
                byModel: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.model,
                ),
                byType: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.type,
                ),
                byColor: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.exteriorColor,
                ),
                byWarehouse: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.warehouse,
                ),
                byBranch: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.branch,
                ),
                byMovementCategory: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.movementCategory,
                ),
                byStatus: breakdown(
                    items,
                    summary.totalUnits,
                    (item) => item.status,
                ),
            },
        };
    }

    async getMonthlyComparison(query: SnapshotQuery = {}) {
        const currentSnapshots = await this.prisma.inventorySnapshot.findMany({
            where: snapshotWhere(query),
            include: { items: { where: snapshotItemWhere(query) } },
            orderBy: { snapshotDate: 'asc' },
        });
        const previousRange = previousComparableRange(query);
        const previousSnapshots = previousRange
            ? await this.prisma.inventorySnapshot.findMany({
                  where: snapshotWhere({
                      ...query,
                      fromDate: previousRange.fromDate,
                      toDate: previousRange.toDate,
                  }),
                  include: { items: { where: snapshotItemWhere(query) } },
                  orderBy: { snapshotDate: 'asc' },
              })
            : [];

        const current = latestSnapshotSummary(
            currentSnapshots,
            query,
            'Current period',
        );
        const previous = latestSnapshotSummary(
            previousSnapshots,
            query,
            'Previous comparable period',
        );

        if (!current || !previous) {
            return [];
        }

        return [
            {
                month: current.periodLabel,
                periodLabel: current.periodLabel,
                totalUnits: current.totalUnits,
                inStockUnits: current.inStockUnits,
                slowUnits: current.slowUnits,
                mediumUnits: current.mediumUnits,
                fastUnits: current.fastUnits,
                soldUnits: current.soldUnits,
                reservedUnits: current.reservedUnits,
                stockValueSar: current.totalValueSar,
                stockValueJod: current.totalValueJod,
                stockValueUsd: current.totalValueUsd,
                previousTotalUnits: previous.totalUnits,
                totalUnitsChange: current.totalUnits - previous.totalUnits,
                inStockUnitsChange:
                    current.inStockUnits - previous.inStockUnits,
                soldUnitsChange: current.soldUnits - previous.soldUnits,
                reservedUnitsChange:
                    current.reservedUnits - previous.reservedUnits,
                slowUnitsChange: current.slowUnits - previous.slowUnits,
                stockValueSarChange:
                    current.totalValueSar - previous.totalValueSar,
                stockValueJodChange:
                    current.totalValueJod - previous.totalValueJod,
                stockValueUsdChange:
                    current.totalValueUsd - previous.totalValueUsd,
            },
            {
                month: previous.periodLabel,
                periodLabel: previous.periodLabel,
                totalUnits: previous.totalUnits,
                inStockUnits: previous.inStockUnits,
                slowUnits: previous.slowUnits,
                mediumUnits: previous.mediumUnits,
                fastUnits: previous.fastUnits,
                soldUnits: previous.soldUnits,
                reservedUnits: previous.reservedUnits,
                stockValueSar: previous.totalValueSar,
                stockValueJod: previous.totalValueJod,
                stockValueUsd: previous.totalValueUsd,
            },
        ];
    }
}

function buildSnapshotItems(items: InventoryItem[]) {
    return Object.values(
        groupBy(
            items,
            (item) =>
                [
                    item.sourceId,
                    item.sourceName,
                    item.brand,
                    item.model,
                    item.type,
                    item.exteriorColor,
                    item.warehouse,
                    item.branch,
                    item.movementCategory,
                    item.normalizedStatus || item.displayStatus,
                ].join('|'),
            (group) => {
                const valueSar = group
                    .filter((item) => item.isInStock)
                    .reduce(
                        (sum, item) =>
                            sum + (item.price1 ?? item.soldPrice ?? 0),
                        0,
                    );

                return {
                    sourceId: group[0]?.sourceId || null,
                    sourceName: group[0]?.sourceName || null,
                    brand: group[0]?.brand || null,
                    model: group[0]?.model || null,
                    type: group[0]?.type || null,
                    exteriorColor: group[0]?.exteriorColor || null,
                    warehouse: group[0]?.warehouse || null,
                    branch: group[0]?.branch || null,
                    movementCategory: group[0]?.movementCategory || null,
                    status:
                        group[0]?.normalizedStatus ||
                        group[0]?.displayStatus ||
                        null,
                    quantity: sumUnits(group),
                    slowUnits: sumUnits(
                        group.filter(
                            (item) => item.movementCategory === 'slow',
                        ),
                    ),
                    mediumUnits: sumUnits(
                        group.filter(
                            (item) => item.movementCategory === 'medium',
                        ),
                    ),
                    fastUnits: sumUnits(
                        group.filter(
                            (item) => item.movementCategory === 'fast',
                        ),
                    ),
                    soldUnits: sumUnits(group.filter((item) => item.isSold)),
                    reservedUnits: sumUnits(
                        group.filter((item) => item.isReserved),
                    ),
                    inStockUnits: sumUnits(
                        group.filter((item) => item.isInStock),
                    ),
                    valueSar,
                    valueJod: valueSar * SAR_TO_JOD,
                    valueUsd: valueSar * SAR_TO_USD,
                };
            },
        ),
    );
}

function buildTotals(items: InventoryItem[]) {
    const totalValueSar = items
        .filter((item) => item.isInStock)
        .reduce((sum, item) => sum + (item.price1 ?? item.soldPrice ?? 0), 0);

    return {
        totalUnits: sumUnits(items),
        soldUnits: sumUnits(items.filter((item) => item.isSold)),
        reservedUnits: sumUnits(items.filter((item) => item.isReserved)),
        inStockUnits: sumUnits(items.filter((item) => item.isInStock)),
        slowUnits: sumUnits(
            items.filter((item) => item.movementCategory === 'slow'),
        ),
        mediumUnits: sumUnits(
            items.filter((item) => item.movementCategory === 'medium'),
        ),
        fastUnits: sumUnits(
            items.filter((item) => item.movementCategory === 'fast'),
        ),
        totalValueSar,
        totalValueJod: totalValueSar * SAR_TO_JOD,
        totalValueUsd: totalValueSar * SAR_TO_USD,
    };
}

function summarizeSnapshot(
    snapshot: Awaited<
        ReturnType<PrismaService['inventorySnapshot']['findMany']>
    >[number] & { items?: SnapshotItem[] },
    query: SnapshotQuery,
) {
    const hasItemFilters = Boolean(
        Object.keys(snapshotItemWhere(query)).length,
    );
    const itemTotals =
        hasItemFilters && snapshot.items
            ? totalsFromSnapshotItems(snapshot.items)
            : null;

    return {
        ...snapshot,
        ...(itemTotals ?? {}),
        items: undefined,
    };
}

type SnapshotItem = {
    quantity: number;
    slowUnits: number;
    mediumUnits: number;
    fastUnits: number;
    soldUnits: number;
    reservedUnits: number;
    inStockUnits: number;
    valueSar: number;
    valueJod: number;
    valueUsd: number;
    sourceId?: string | null;
    sourceName?: string | null;
    brand?: string | null;
    model?: string | null;
    type?: string | null;
    exteriorColor?: string | null;
    warehouse?: string | null;
    branch?: string | null;
    movementCategory?: string | null;
    status?: string | null;
};

function totalsFromSnapshotItems(items: SnapshotItem[]) {
    return {
        totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
        soldUnits: items.reduce((sum, item) => sum + item.soldUnits, 0),
        reservedUnits: items.reduce((sum, item) => sum + item.reservedUnits, 0),
        inStockUnits: items.reduce((sum, item) => sum + item.inStockUnits, 0),
        slowUnits: items.reduce((sum, item) => sum + item.slowUnits, 0),
        mediumUnits: items.reduce((sum, item) => sum + item.mediumUnits, 0),
        fastUnits: items.reduce((sum, item) => sum + item.fastUnits, 0),
        totalValueSar: items.reduce((sum, item) => sum + item.valueSar, 0),
        totalValueJod: items.reduce((sum, item) => sum + item.valueJod, 0),
        totalValueUsd: items.reduce((sum, item) => sum + item.valueUsd, 0),
    };
}

function breakdown(
    items: SnapshotItem[],
    totalUnits: number,
    keyFactory: (item: SnapshotItem) => string | null | undefined,
) {
    return Object.values(
        groupBy(
            items,
            (item) => keyFactory(item) || 'Unknown',
            (group, key) => {
                const totals = totalsFromSnapshotItems(group);
                return {
                    key,
                    label: key,
                    units: totals.totalUnits,
                    slowUnits: totals.slowUnits,
                    mediumUnits: totals.mediumUnits,
                    fastUnits: totals.fastUnits,
                    soldUnits: totals.soldUnits,
                    reservedUnits: totals.reservedUnits,
                    inStockUnits: totals.inStockUnits,
                    stockValueSar: totals.totalValueSar,
                    stockValueJod: totals.totalValueJod,
                    stockValueUsd: totals.totalValueUsd,
                    percentageOfTotal:
                        totalUnits > 0
                            ? Math.round(
                                  (totals.totalUnits / totalUnits) * 10000,
                              ) / 100
                            : 0,
                };
            },
        ),
    ).sort((left, right) => right.units - left.units);
}

function snapshotWhere(query: SnapshotQuery) {
    const where: Record<string, unknown> = {};
    if (query.fromDate || query.toDate) {
        where.snapshotDate = {
            ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
            ...(query.toDate ? { lte: endOfDay(query.toDate) } : {}),
        };
    }
    if (query.sourceId) {
        where.sourceId = query.sourceId;
    }
    if (query.isFiltered === 'true' || query.isFiltered === 'false') {
        where.isFiltered = query.isFiltered === 'true';
    }
    return where;
}

function snapshotItemWhere(query: SnapshotQuery) {
    const where: Record<string, unknown> = {};
    const textFields = [
        'sourceId',
        'brand',
        'model',
        'type',
        'exteriorColor',
        'warehouse',
        'branch',
    ];
    textFields.forEach((field) => {
        const value = query[field];
        if (value) {
            where[field] = value;
        }
    });
    return where;
}

function latestSnapshotSummary(
    snapshots: Array<
        { items?: SnapshotItem[]; snapshotDate: Date } & Record<string, unknown>
    >,
    query: SnapshotQuery,
    fallbackLabel: string,
) {
    const latest = snapshots[snapshots.length - 1];
    if (!latest) {
        return null;
    }
    const summary = summarizeSnapshot(latest as never, query);
    return {
        ...summary,
        periodLabel: dateRangeLabel(query) || fallbackLabel,
    };
}

function previousComparableRange(query: SnapshotQuery) {
    if (!query.fromDate || !query.toDate) {
        return null;
    }
    const from = new Date(query.fromDate);
    const to = endOfDay(query.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return null;
    }
    const days = Math.max(
        1,
        Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
    );
    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - days);
    return {
        fromDate: toDateInputValue(previousFrom),
        toDate: toDateInputValue(previousTo),
    };
}

function cleanSnapshotFilters(filters: SnapshotQuery) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value)),
    );
}

function toInventoryQuery(filters: SnapshotQuery): InventoryQueryDto {
    return {
        sourceId: filters.sourceId,
        brand: filters.brand,
        model: filters.model,
        color: filters.exteriorColor,
        branch: filters.branch,
        warehouse: filters.warehouse,
        movementCategory: filters.movementCategory,
    };
}

function summarizeFilters(filters: SnapshotQuery) {
    return Object.entries(filters)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
}

function dateRangeLabel(query: SnapshotQuery) {
    if (!query.fromDate && !query.toDate) {
        return '';
    }
    return `${query.fromDate ?? '...'} - ${query.toDate ?? '...'}`;
}

function endOfDay(value: string) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
}

function toDateInputValue(date: Date) {
    return date.toISOString().slice(0, 10);
}

function oneValue(
    items: InventoryItem[],
    getter: (item: InventoryItem) => string,
) {
    const values = Array.from(new Set(items.map(getter).filter(Boolean)));
    return values.length === 1 ? values[0] : null;
}

function sumUnits(items: Array<{ quantity: number }>) {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}
