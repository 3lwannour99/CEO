import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { groupBy } from '../common/calculations/grouping';

const SAR_TO_JOD = 0.188;
const SAR_TO_USD = 0.2667;

@Injectable()
export class SnapshotsService {
    constructor(
        private readonly inventoryService: InventoryService,
        private readonly prisma: PrismaService,
    ) {}

    async runSnapshot() {
        const response = await this.inventoryService.findAll({});
        const snapshotDate = new Date();
        const totals = buildTotals(response.data);
        const items = Object.values(
            groupBy(
                response.data.filter((item) => item.isInStock),
                (item) =>
                    `${item.sourceId}|${item.brand}|${item.model}|${item.type}|${item.exteriorColor}|${item.warehouse}`,
                (group) => {
                    const valueSar = group.reduce(
                        (sum, item) =>
                            sum + (item.price1 ?? item.soldPrice ?? 0),
                        0,
                    );
                    return {
                        sourceId: group[0]?.sourceId || null,
                        brand: group[0]?.brand || null,
                        model: group[0]?.model || null,
                        type: group[0]?.type || null,
                        exteriorColor: group[0]?.exteriorColor || null,
                        warehouse: group[0]?.warehouse || null,
                        quantity: group.reduce(
                            (sum, item) => sum + (item.quantity || 1),
                            0,
                        ),
                        valueSar,
                        valueJod: valueSar * SAR_TO_JOD,
                        valueUsd: valueSar * SAR_TO_USD,
                    };
                },
            ),
        );

        return this.prisma.inventorySnapshot.create({
            data: {
                snapshotDate,
                sourceId: null,
                sourceName: 'All Sources',
                ...totals,
                items: { create: items },
            },
            include: { items: true },
        });
    }

    findAll() {
        return this.prisma.inventorySnapshot.findMany({
            include: { items: true },
            orderBy: { snapshotDate: 'desc' },
            take: 90,
        });
    }

    async getMonthlyComparison() {
        const snapshots = await this.prisma.inventorySnapshot.findMany({
            orderBy: { snapshotDate: 'asc' },
        });

        return Object.values(
            groupBy(
                snapshots,
                (snapshot) => toMonth(snapshot.snapshotDate),
                (group, month) => {
                    const latest = group[group.length - 1];
                    return {
                        month,
                        totalUnits: latest?.totalUnits ?? 0,
                        slowUnits: latest?.slowUnits ?? 0,
                        mediumUnits: latest?.mediumUnits ?? 0,
                        fastUnits: latest?.fastUnits ?? 0,
                        soldUnits: latest?.soldUnits ?? 0,
                        reservedUnits: latest?.reservedUnits ?? 0,
                        stockValueSar: latest?.totalValueSar ?? 0,
                        stockValueJod: latest?.totalValueJod ?? 0,
                        stockValueUsd: latest?.totalValueUsd ?? 0,
                    };
                },
            ),
        );
    }
}

function buildTotals(
    items: Awaited<ReturnType<InventoryService['findAll']>>['data'],
) {
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

function sumUnits(items: Array<{ quantity: number }>) {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function toMonth(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
