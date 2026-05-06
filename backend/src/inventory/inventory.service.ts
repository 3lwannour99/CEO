import { Injectable } from '@nestjs/common';
import { CounterScreenService } from '../integrations/counterscreen/counterscreen.service';
import {
    InventoryItem,
    InventoryMeta,
    InventoryResponse,
    InventorySummary,
} from '../integrations/counterscreen/counterscreen.types';
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
    constructor(private readonly counterScreenService: CounterScreenService) {}

    async findAll(query: InventoryQueryDto): Promise<InventoryResponse> {
        const response = await this.counterScreenService.getInventory(
            isRefresh(query.refresh),
        );
        const data = this.applyFilters(response.data, query);

        return {
            data,
            meta: {
                ...response.meta,
                total: data.length,
            },
        };
    }

    async findRaw(query: Pick<InventoryQueryDto, 'sourceId' | 'refresh'>) {
        const response = await this.counterScreenService.getRawInventory(
            isRefresh(query.refresh),
        );
        const data = query.sourceId
            ? response.data.filter(
                  (item) =>
                      item.source.id.toLowerCase() ===
                      query.sourceId?.toLowerCase(),
              )
            : response.data;

        return {
            data,
            meta: {
                ...response.meta,
                totalRawRecords: data.reduce(
                    (sum, item) => sum + item.records.length,
                    0,
                ),
            },
        };
    }

    async getSummary(query: InventoryQueryDto = {}): Promise<InventorySummary> {
        const { data } = await this.findAll(query);
        const currentStock = data.filter((item) => item.isInStock);
        const sold = data.filter((item) => item.isSold);
        const soldLast90Days = getSoldLast90Days(data);
        const averageMonthlySales = soldLast90Days / 3;

        return {
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
        return (await this.findAll(query)).meta;
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
