import { Injectable } from '@nestjs/common';
import type { InventoryItem as InventoryItemRow } from '../generated/prisma-client/client.js';
import {
    InventoryItem,
    InventoryMeta,
    InventoryResponse,
    InventorySummary,
} from '../integrations/counterscreen/counterscreen.types';
import { InventorySyncService } from '../inventory-sync/inventory-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryQueryDto } from './dto/inventory-query.dto';

export interface ReplenishmentSuggestion {
    brand: string;
    model: string;
    exteriorColor: string;
    currentStock: number;
    soldLast90Days: number;
    averageMonthlySales: number;
    suggestedOrderQuantity: number;
    reorderPoint: number;
}

export interface StockCoverageItem extends ReplenishmentSuggestion {
    coverageMonths: number | null;
    status: 'danger' | 'healthy' | 'overstock' | 'unknown';
}

@Injectable()
export class InventoryService {
    constructor(
        private readonly inventorySyncService: InventorySyncService,
        private readonly prisma: PrismaService,
    ) {}

    async findAll(query: InventoryQueryDto): Promise<InventoryResponse> {
        const syncResult = await this.syncIfRequested(query);
        const rows = await this.prisma.inventoryItem.findMany({
            orderBy: [{ sourceId: 'asc' }, { brand: 'asc' }, { model: 'asc' }],
        });
        const data = this.applyFilters(rows.map(toInventoryItem), query);

        return {
            data,
            meta: await this.buildMeta(data.length, syncResult),
        };
    }

    async findRaw(query: Pick<InventoryQueryDto, 'sourceId' | 'refresh'>) {
        const syncResult = await this.syncIfRequested(query);
        const meta = await this.buildMeta(0, syncResult);

        return {
            data: [],
            message:
                'Raw inventory record storage is disabled. InventoryItem is the reporting source of truth; use inspection scripts to fetch live CounterScreen API payloads when debugging.',
            meta: {
                ...meta,
                totalRawRecords: 0,
            },
        };
    }

    async getSummary(query: InventoryQueryDto = {}): Promise<InventorySummary> {
        const { data } = await this.findAll(query);
        const currentStock = data.filter((item) => item.isInStock);
        const sold = data.filter((item) => item.isSold);
        const soldLast90Days = getSoldLast90Days(data);
        const averageMonthlySales = soldLast90Days / 3;
        const chassisGroups = Object.values(
            groupBy(
                data.filter((item) => Boolean(item.chassis)),
                (item) => `${item.sourceId}|${item.chassis}`,
                (items) => items,
            ),
        );
        const multiStatusGroups = chassisGroups.filter(
            (items) => items.length > 1,
        );

        return {
            totalRows: data.length,
            uniqueChassisCount: chassisGroups.length,
            multiStatusChassisCount: multiStatusGroups.length,
            rowsInMultiStatusChassisGroups: multiStatusGroups.reduce(
                (sum, items) => sum + items.length,
                0,
            ),
            totalUnits: sumQuantity(data),
            currentStockUnits: sumQuantity(currentStock),
            soldUnits: sumQuantity(sold),
            reservedUnits: sumQuantity(data.filter((item) => item.isReserved)),
            fastMovingUnits: sumQuantity(
                data.filter((item) => item.movementCategory === 'fast'),
            ),
            mediumMovingUnits: sumQuantity(
                data.filter((item) => item.movementCategory === 'medium'),
            ),
            slowMovingUnits: sumQuantity(
                data.filter((item) => item.movementCategory === 'slow'),
            ),
            unknownAgeUnits: sumQuantity(
                data.filter((item) => item.movementCategory === 'unknown'),
            ),
            inTransitUnits: sumQuantity(
                data.filter((item) => isInTransit(item)),
            ),
            readyForSaleUnits: sumQuantity(
                data.filter((item) => item.isReadyForSale),
            ),
            stockCoverageMonths:
                averageMonthlySales > 0
                    ? round(sumQuantity(currentStock) / averageMonthlySales)
                    : null,
            sources: Object.values(
                groupBy(
                    data,
                    (item) => item.sourceId,
                    (items) => ({
                        sourceId: items[0]?.sourceId ?? '',
                        sourceName: items[0]?.sourceName ?? '',
                        country: items[0]?.sourceCountry ?? '',
                        totalUnits: sumQuantity(items),
                        currentStockUnits: sumQuantity(
                            items.filter((item) => item.isInStock),
                        ),
                    }),
                ),
            ),
        };
    }

    async getMultiStatusChassis(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        const groups = Object.values(
            groupBy(
                data.filter((item) => Boolean(item.chassis)),
                (item) => `${item.sourceId}|${item.chassis}`,
                (items) => items,
            ),
        ).filter((items) => items.length > 1);

        const sorted = groups
            .map((rows) => ({
                sourceId: rows[0]?.sourceId ?? '',
                sourceName: rows[0]?.sourceName ?? '',
                chassis: rows[0]?.chassis ?? '',
                rowCount: rows.length,
                statuses: Array.from(
                    new Set(
                        rows.map(
                            (row) =>
                                row.rawStatus ||
                                row.displayStatus ||
                                row.normalizedStatus,
                        ),
                    ),
                ).filter(Boolean),
                rows,
            }))
            .sort((left, right) => right.rowCount - left.rowCount);

        return {
            data: sorted,
            meta: {
                totalGroups: sorted.length,
                totalRows: sorted.reduce(
                    (sum, group) => sum + group.rowCount,
                    0,
                ),
                generatedAt: new Date().toISOString(),
                lastSyncedAt:
                    (
                        await this.prisma.inventoryItem.aggregate({
                            _max: { lastSyncedAt: true },
                        })
                    )._max.lastSyncedAt?.toISOString() ?? null,
            },
        };
    }

    async getReplenishment(
        query: InventoryQueryDto = {},
    ): Promise<ReplenishmentSuggestion[]> {
        const { data } = await this.findAll(query);

        return Object.values(
            groupBy(data, stockKey, (items) => {
                const currentStock = sumQuantity(
                    items.filter((item) => item.isInStock),
                );
                const soldLast90Days = getSoldLast90Days(items);
                const averageMonthlySales = soldLast90Days / 3;
                const reorderPoint = Math.ceil(averageMonthlySales * 1.5);

                return {
                    brand: items[0]?.brand ?? '',
                    model: items[0]?.model ?? '',
                    exteriorColor: items[0]?.exteriorColor ?? '',
                    currentStock,
                    soldLast90Days,
                    averageMonthlySales: round(averageMonthlySales),
                    suggestedOrderQuantity: Math.max(
                        0,
                        Math.ceil(reorderPoint - currentStock),
                    ),
                    reorderPoint,
                };
            }),
        ).sort((a, b) => b.suggestedOrderQuantity - a.suggestedOrderQuantity);
    }

    async getStockCoverage(
        query: InventoryQueryDto = {},
    ): Promise<StockCoverageItem[]> {
        const suggestions = await this.getReplenishment(query);

        return suggestions.map((item) => {
            const coverageMonths =
                item.averageMonthlySales > 0
                    ? round(item.currentStock / item.averageMonthlySales)
                    : null;
            return {
                ...item,
                coverageMonths,
                status:
                    coverageMonths === null
                        ? 'unknown'
                        : coverageMonths < 1
                          ? 'danger'
                          : coverageMonths > 4
                            ? 'overstock'
                            : 'healthy',
            };
        });
    }

    async getAggregatedStock(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        return Object.values(
            groupBy(
                data.filter((item) => item.isInStock),
                stockKey,
                (items) => ({
                    brand: items[0]?.brand ?? '',
                    model: items[0]?.model ?? '',
                    exteriorColor: items[0]?.exteriorColor ?? '',
                    units: sumQuantity(items),
                }),
            ),
        ).sort((a, b) => b.units - a.units);
    }

    async getSalesPerformance(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        const sold = data.filter((item) => item.isSold);

        return {
            soldUnitsByModel: Object.values(
                groupBy(
                    sold,
                    (item) => `${item.brand}|${item.model}`,
                    (items) => ({
                        brand: items[0]?.brand ?? '',
                        model: items[0]?.model ?? '',
                        unitsSold: sumQuantity(items),
                        revenue: sumSoldPrice(items),
                    }),
                ),
            ).sort((a, b) => b.unitsSold - a.unitsSold),
            soldUnitsByBranch: Object.values(
                groupBy(
                    sold,
                    (item) => item.branch || 'Unknown',
                    (items) => ({
                        branch: items[0]?.branch || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            soldUnitsBySource: Object.values(
                groupBy(
                    sold,
                    (item) => item.sourceId,
                    (items) => ({
                        sourceId: items[0]?.sourceId ?? '',
                        sourceName: items[0]?.sourceName ?? '',
                        country: items[0]?.sourceCountry ?? '',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            soldRevenue: sumSoldPrice(sold),
            customerGroupBreakdown: Object.values(
                groupBy(
                    sold,
                    (item) => item.customerGroup || 'Unknown',
                    (items) => ({
                        customerGroup: items[0]?.customerGroup || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            topSellingModels: Object.values(
                groupBy(
                    sold,
                    (item) => `${item.brand}|${item.model}`,
                    (items) => ({
                        brand: items[0]?.brand ?? '',
                        model: items[0]?.model ?? '',
                        unitsSold: sumQuantity(items),
                        revenue: sumSoldPrice(items),
                    }),
                ),
            )
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .slice(0, 10),
            lowestSellingModels: Object.values(
                groupBy(
                    sold,
                    (item) => `${item.brand}|${item.model}`,
                    (items) => ({
                        brand: items[0]?.brand ?? '',
                        model: items[0]?.model ?? '',
                        unitsSold: sumQuantity(items),
                        revenue: sumSoldPrice(items),
                    }),
                ),
            )
                .sort((a, b) => a.unitsSold - b.unitsSold)
                .slice(0, 10),
        };
    }

    async getLogistics(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        return data
            .filter(
                (item) =>
                    item.poNo ||
                    item.estimatedArrival ||
                    item.grpoDate ||
                    item.apInvoiceDate,
            )
            .map((item) => ({
                poNo: item.poNo,
                estimatedArrival: item.estimatedArrival,
                grpoDate: item.grpoDate,
                apInvoiceDate: item.apInvoiceDate,
                branch: item.branch,
                warehouse: item.warehouse,
                sourceId: item.sourceId,
                sourceName: item.sourceName,
                status: getLogisticsStatus(item),
                units: item.quantity,
            }));
    }

    async getMultiLocation(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        return Object.values(
            groupBy(
                data.filter((item) => item.isInStock),
                (item) =>
                    `${item.sourceId}|${item.branch}|${item.warehouse}|${item.brand}|${item.model}|${item.exteriorColor}`,
                (items) => ({
                    sourceId: items[0]?.sourceId ?? '',
                    sourceName: items[0]?.sourceName ?? '',
                    country: items[0]?.sourceCountry ?? '',
                    branch: items[0]?.branch ?? '',
                    warehouse: items[0]?.warehouse ?? '',
                    brand: items[0]?.brand ?? '',
                    model: items[0]?.model ?? '',
                    exteriorColor: items[0]?.exteriorColor ?? '',
                    currentStock: sumQuantity(items),
                }),
            ),
        );
    }

    async getAlerts(query: InventoryQueryDto = {}) {
        const response = await this.findAll(query);
        const alerts = [
            ...response.meta.errors.map((error) => ({
                id: `source-${error.sourceId}`,
                title: 'Source API failure',
                message: `${error.sourceName} could not be reached.`,
                severity: 'critical',
                branch: error.sourceName,
                createdAt: response.meta.generatedAt,
            })),
            ...response.data
                .filter(
                    (item) =>
                        item.movementCategory === 'slow' && item.isInStock,
                )
                .slice(0, 25)
                .map((item) => ({
                    id: `slow-${item.sourceId}-${item.chassis || item.itemCode}`,
                    title: 'Slow stock 90+ days',
                    message: `${item.brand} ${item.model} has ${item.stockAgeDays ?? 0} stock age days.`,
                    severity: 'warning',
                    branch: item.branch || item.sourceName,
                    createdAt: response.meta.generatedAt,
                })),
            ...response.data
                .filter(
                    (item) =>
                        item.movementCategory === 'unknown' && item.isInStock,
                )
                .slice(0, 25)
                .map((item) => ({
                    id: `unknown-age-${item.sourceId}-${item.chassis || item.itemCode}`,
                    title: 'Unknown stock age',
                    message: `${item.brand} ${item.model} has no usable stock date.`,
                    severity: 'info',
                    branch: item.branch || item.sourceName,
                    createdAt: response.meta.generatedAt,
                })),
        ];

        return alerts;
    }

    async getMeta(query: InventoryQueryDto = {}): Promise<InventoryMeta> {
        const syncResult = await this.syncIfRequested(query);
        const count = await this.prisma.inventoryItem.count();
        return this.buildMeta(count, syncResult);
    }

    private async syncIfRequested(query: Pick<InventoryQueryDto, 'refresh'>) {
        if (!isRefresh(query.refresh)) {
            return null;
        }

        return this.inventorySyncService.runSync('refresh');
    }

    private async buildMeta(
        total: number,
        syncResult?: unknown,
    ): Promise<InventoryMeta> {
        const latestRun = await this.inventorySyncService.getLatestRun();
        const lastSyncedAt = await this.prisma.inventoryItem.aggregate({
            _max: { lastSyncedAt: true },
        });
        const sourceResults = latestRun?.sourceResults ?? [];
        const errors = sourceResults
            .filter((result) => result.status === 'failed')
            .map((result) => ({
                sourceId: result.sourceId,
                sourceName: result.sourceName,
                message: result.errorMessage ?? 'Source API unavailable',
            }));

        return {
            errors,
            failedSources: latestRun?.failedSources ?? errors.length,
            fromCache: false,
            fromDatabase: true,
            generatedAt: new Date().toISOString(),
            lastSyncedAt: lastSyncedAt._max.lastSyncedAt?.toISOString() ?? null,
            sourceCount: latestRun?.totalSources ?? sourceResults.length,
            successfulSources: latestRun?.successfulSources ?? 0,
            syncResult,
            syncStatus: latestRun?.status ?? 'unknown',
            total,
        };
    }

    applyFilters(
        data: InventoryItem[],
        query: InventoryQueryDto,
    ): InventoryItem[] {
        return data.filter((item) => {
            const readyFilter = parseOptionalBoolean(query.ready);
            return (
                equalsOptional(item.sourceId, query.sourceId) &&
                equalsOptional(item.brand, query.brand) &&
                containsOptional(item.model, query.model) &&
                containsOptional(item.exteriorColor, query.color) &&
                equalsOptional(item.branch, query.branch) &&
                equalsOptional(item.warehouse, query.warehouse) &&
                statusMatches(item, query.status) &&
                equalsOptional(item.movementCategory, query.movementCategory) &&
                (readyFilter === null ||
                    item.isReadyForSale === readyFilter ||
                    item.ready === readyFilter) &&
                searchMatches(item, query.search)
            );
        });
    }
}

function toInventoryItem(row: InventoryItemRow): InventoryItem {
    return {
        absEntry: row.absEntry,
        additionalRemark: row.additionalRemark,
        apInvoiceDate: row.apInvoiceDate,
        apInvoiceNo: row.apInvoiceNo,
        arInvoiceDate: row.arInvoiceDate,
        arInvoiceNo: row.arInvoiceNo,
        bank: row.bank,
        bankCode: row.bankCode,
        branch: row.branch,
        brand: row.brand,
        cardCode: row.cardCode,
        chassis: row.chassis,
        chassisStatus: row.chassisStatus,
        contractDate: row.contractDate,
        createDate: row.createDate,
        customerGroup: row.customerGroup,
        customerName: row.customerName,
        customerNumber: row.customerNumber,
        displayStatus: row.displayStatus as InventoryItem['displayStatus'],
        engineNo: row.engineNo,
        estimatedArrival: row.estimatedArrival,
        exteriorColor: row.exteriorColor,
        grpoDate: row.grpoDate,
        interiorColor: row.interiorColor,
        isInStock: row.isInStock,
        isReadyForSale: row.isReadyForSale,
        isReserved: row.isReserved,
        isSold: row.isSold,
        itemCode: row.itemCode,
        itemGroupCode: row.itemGroupCode,
        listName1: row.listName1,
        listName2: row.listName2,
        listName3: row.listName3,
        listName4: row.listName4,
        listNum1: row.listNum1,
        listNum2: row.listNum2,
        listNum3: row.listNum3,
        listNum4: row.listNum4,
        model: row.model,
        modelYear: row.modelYear,
        movementCategory:
            row.movementCategory as InventoryItem['movementCategory'],
        normalizedStatus:
            row.normalizedStatus as InventoryItem['normalizedStatus'],
        notes: row.notes,
        businessStateKey: row.businessStateKey,
        inventoryKey: row.inventoryKey,
        plateNumber: row.plateNumber,
        poNo: row.poNo,
        price1: row.price1,
        price2: row.price2,
        price3: row.price3,
        price4: row.price4,
        quantity: row.quantity,
        rawStatus: row.rawStatus,
        ready: row.ready,
        reserveDate: row.reserveDate,
        salesMan: row.salesMan,
        soRemarks: row.soRemarks,
        soldPrice: row.soldPrice,
        sourceBaseUrl: row.sourceBaseUrl,
        sourceCountry: row.sourceCountry,
        sourceId: row.sourceId,
        sourceRowIndex: row.sourceRowIndex,
        sourceName: row.sourceName,
        stockAgeDays: row.stockAgeDays,
        rowHash: row.rowHash,
        syncRunId: row.syncRunId,
        type: row.type,
        vat: row.vat,
        warehouse: row.warehouse,
        wheel: row.wheel,
    };
}

export function isRefresh(value?: string): boolean {
    return value === 'true' || value === '1' || value === 'yes';
}

function parseOptionalBoolean(value?: string): boolean | null {
    if (!value) {
        return null;
    }

    return ['true', '1', 'yes'].includes(value.toLowerCase());
}

function equalsOptional(value: string, filter?: string): boolean {
    return !filter || value.toLowerCase() === filter.toLowerCase();
}

function containsOptional(value: string, filter?: string): boolean {
    return !filter || value.toLowerCase().includes(filter.toLowerCase());
}

function statusMatches(item: InventoryItem, filter?: string): boolean {
    if (!filter) {
        return true;
    }

    const normalized = normalizeStatusFilter(filter);
    return (
        normalizeStatusFilter(item.normalizedStatus) === normalized ||
        normalizeStatusFilter(item.chassisStatus) === normalized ||
        normalizeStatusFilter(item.rawStatus) === normalized ||
        normalizeStatusFilter(item.displayStatus) === normalized ||
        (normalized === 'sold' && item.isSold) ||
        (['reserve', 'reservationforcompanies', 'reserved'].includes(
            normalized,
        ) &&
            item.isReserved) ||
        (['instock', 'in-stock'].includes(normalized) && item.isInStock)
    );
}

function normalizeStatusFilter(value?: string): string {
    return (value ?? '')
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z-]/g, '')
        .replace(/-/g, '');
}

function searchMatches(item: InventoryItem, search?: string): boolean {
    if (!search) {
        return true;
    }

    const needle = search.toLowerCase();
    return [
        item.chassis,
        item.itemCode,
        item.model,
        item.brand,
        item.exteriorColor,
        item.interiorColor,
        item.branch,
        item.warehouse,
        item.customerName,
        item.salesMan,
    ].some((value) => value.toLowerCase().includes(needle));
}

function sumQuantity(items: InventoryItem[]): number {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function sumSoldPrice(items: InventoryItem[]): number {
    return items.reduce((sum, item) => sum + item.soldPrice, 0);
}

function getSoldLast90Days(items: InventoryItem[]): number {
    return sumQuantity(
        items.filter((item) => {
            if (!item.isSold || !item.arInvoiceDate) {
                return false;
            }

            const date = new Date(item.arInvoiceDate);
            if (Number.isNaN(date.getTime())) {
                return false;
            }

            return Date.now() - date.getTime() <= 90 * 86_400_000;
        }),
    );
}

function groupBy<T, R>(
    items: T[],
    keyFactory: (item: T) => string,
    mapper: (items: T[]) => R,
): Record<string, R> {
    const grouped = items.reduce<Record<string, T[]>>((groups, item) => {
        const key = keyFactory(item) || 'Unknown';
        groups[key] = groups[key] ?? [];
        groups[key].push(item);
        return groups;
    }, {});

    return Object.fromEntries(
        Object.entries(grouped).map(([key, groupItems]) => [
            key,
            mapper(groupItems),
        ]),
    );
}

function stockKey(item: InventoryItem): string {
    return `${item.brand}|${item.model}|${item.exteriorColor}`;
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function isInTransit(item: InventoryItem): boolean {
    return Boolean(item.estimatedArrival && !item.grpoDate && !item.isSold);
}

function getLogisticsStatus(item: InventoryItem): string {
    if (item.isSold) {
        return 'Sold';
    }

    if (item.estimatedArrival && !item.grpoDate) {
        return 'In Transit';
    }

    if (item.grpoDate && !item.isSold) {
        return 'Warehouse';
    }

    return 'Unknown';
}
