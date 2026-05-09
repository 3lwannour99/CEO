import { Injectable } from '@nestjs/common';
import { CounterScreenService } from '../integrations/counterscreen/counterscreen.service';
import {
    InventoryItem,
    InventoryMeta,
    InventoryResponse,
    InventorySummary,
} from '../integrations/counterscreen/counterscreen.types';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { deriveLogisticsStatus, daysBetween, getOrderDate } from '../common/calculations/logistics';
import { resolveStockRule } from '../common/calculations/stock-rules';
import { getSalesKpis } from '../common/calculations/sales-metrics';
import { StockRulesService } from '../stock-rules/stock-rules.service';

export interface ReplenishmentSuggestion {
    brand: string;
    model: string;
    type?: string;
    exteriorColor: string;
    warehouse?: string;
    sourceId?: string;
    sourceName?: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    soldLast90Days: number;
    soldLast30Days: number;
    averageMonthlySales: number;
    leadTimeDays: number;
    leadTimeDemand: number;
    suggestedOrderQuantity: number;
    reorderPoint: number;
    targetCoverageMonths: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
}

export interface StockCoverageItem extends ReplenishmentSuggestion {
    coverageMonths: number | null;
    status: 'danger' | 'healthy' | 'overstock' | 'noSalesData';
    recommendedAction: string;
}

@Injectable()
export class InventoryService {
    constructor(
        private readonly counterScreenService: CounterScreenService,
        private readonly stockRulesService: StockRulesService,
    ) {}

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
        const rules = await this.stockRulesService.findAll();

        return Object.values(
            groupBy(data, stockKey, (items) => {
                const sample = items[0];
                const rule = sample ? resolveStockRule(sample, rules) : resolveStockRule({ sourceId: '', brand: '', model: '', type: '', exteriorColor: '', warehouse: '' }, rules);
                const currentStock = sumQuantity(
                    items.filter((item) => item.isInStock),
                );
                const soldLast90Days = getSoldLast90Days(items);
                const soldLast30Days = getSoldLastDays(items, 30);
                const averageMonthlySales = soldLast90Days / 3;
                const averageDailySales = soldLast90Days / 90;
                const leadTimeDemand = averageDailySales * rule.leadTimeDays;
                const suggestedOrderQuantity = Math.max(
                    0,
                    rule.maxStock - currentStock,
                );
                const urgency: ReplenishmentSuggestion['urgency'] =
                    currentStock <= rule.minStock
                        ? 'critical'
                        : currentStock <= rule.reorderPoint
                          ? 'high'
                          : currentStock < rule.maxStock
                            ? 'medium'
                            : 'low';

                return {
                    brand: sample?.brand ?? '',
                    model: sample?.model ?? '',
                    type: sample?.type ?? '',
                    exteriorColor: sample?.exteriorColor ?? '',
                    warehouse: sample?.warehouse ?? '',
                    sourceId: sample?.sourceId ?? '',
                    sourceName: sample?.sourceName ?? '',
                    currentStock,
                    minStock: rule.minStock,
                    maxStock: rule.maxStock,
                    soldLast90Days,
                    soldLast30Days,
                    averageMonthlySales: round(averageMonthlySales),
                    leadTimeDays: rule.leadTimeDays,
                    leadTimeDemand: round(leadTimeDemand),
                    suggestedOrderQuantity,
                    reorderPoint: rule.reorderPoint,
                    targetCoverageMonths: rule.targetCoverageMonths,
                    urgency,
                    reason:
                        urgency === 'critical'
                            ? 'Current stock is below minimum stock.'
                            : urgency === 'high'
                              ? 'Current stock is below reorder point.'
                              : suggestedOrderQuantity > 0
                                ? 'Stock is below max target.'
                                : 'Stock is within configured range.',
                };
            }),
        ).sort(
            (a, b) =>
                urgencyRank(b.urgency) - urgencyRank(a.urgency) ||
                b.suggestedOrderQuantity - a.suggestedOrderQuantity,
        );
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
            const status =
                coverageMonths === null
                    ? 'noSalesData'
                    : coverageMonths < 1
                      ? 'danger'
                      : coverageMonths > 4
                        ? 'overstock'
                        : 'healthy';
            return {
                ...item,
                coverageMonths,
                status,
                recommendedAction:
                    status === 'danger'
                        ? 'Reorder immediately or rebalance stock.'
                        : status === 'overstock'
                          ? 'Pause ordering and consider transfer or promotion.'
                          : status === 'noSalesData'
                            ? 'Not available from current data.'
                            : 'Maintain current plan.',
            };
        });
    }

    async getAggregatedStock(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        const inStock = data.filter((item) => item.isInStock);

        return {
            byTypeColor: Object.values(
                groupBy(inStock, (item) => `${item.type}|${item.exteriorColor}`, (items) => ({
                    type: items[0]?.type ?? '',
                    exteriorColor: items[0]?.exteriorColor ?? '',
                    units: sumQuantity(items),
                })),
            ).sort((a, b) => b.units - a.units),
            byModelColor: Object.values(
                groupBy(inStock, stockKey, (items) => ({
                    brand: items[0]?.brand ?? '',
                    model: items[0]?.model ?? '',
                    exteriorColor: items[0]?.exteriorColor ?? '',
                    units: sumQuantity(items),
                })),
            ).sort((a, b) => b.units - a.units),
            byWarehouseTypeColor: Object.values(
                groupBy(
                    inStock,
                    (item) => `${item.warehouse}|${item.type}|${item.exteriorColor}`,
                    (items) => ({
                        warehouse: items[0]?.warehouse ?? '',
                        type: items[0]?.type ?? '',
                        exteriorColor: items[0]?.exteriorColor ?? '',
                        units: sumQuantity(items),
                    }),
                ),
            ).sort((a, b) => b.units - a.units),
        };
    }

    async getSalesPerformance(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        const sold = data.filter((item) => item.isSold);
        const kpis = getSalesKpis(data);
        const byModel = Object.values(
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
        ).sort((a, b) => b.unitsSold - a.unitsSold);

        return {
            soldUnitsByModel: byModel,
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
            lowestSellingModels: [...byModel].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10),
            averageMovement: round(kpis.soldUnits / Math.max(1, byModel.length)),
            breakdownByModel: byModel,
            breakdownByType: Object.values(groupBy(sold, (item) => item.type || 'Unknown', (items) => ({ type: items[0]?.type || 'Unknown', unitsSold: sumQuantity(items) }))),
            breakdownByColor: Object.values(groupBy(sold, (item) => item.exteriorColor || 'Unknown', (items) => ({ exteriorColor: items[0]?.exteriorColor || 'Unknown', unitsSold: sumQuantity(items) }))),
            breakdownByBranch: Object.values(groupBy(sold, (item) => item.branch || 'Unknown', (items) => ({ branch: items[0]?.branch || 'Unknown', unitsSold: sumQuantity(items) }))),
            breakdownByCountry: Object.values(groupBy(sold, (item) => item.sourceCountry || 'Unknown', (items) => ({ country: items[0]?.sourceCountry || 'Unknown', unitsSold: sumQuantity(items) }))),
            sellThroughRate: kpis.sellThroughRate,
            inventoryTurnover: kpis.inventoryTurnover,
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
                chassis: item.chassis,
                poNo: item.poNo,
                estimatedArrival: item.estimatedArrival,
                grpoDate: item.grpoDate,
                apInvoiceDate: item.apInvoiceDate,
                orderDate: getOrderDate(item),
                branch: item.branch,
                warehouse: item.warehouse,
                sourceId: item.sourceId,
                sourceName: item.sourceName,
                status: deriveLogisticsStatus(item),
                cycleTimeDays: daysBetween(getOrderDate(item), item.grpoDate),
                supplierDelayDays: daysBetween(
                    item.estimatedArrival,
                    item.grpoDate,
                ),
                isDelayed:
                    (daysBetween(item.estimatedArrival, item.grpoDate) ?? 0) >
                    0,
                shippingCost: null,
                units: item.quantity,
            }));
    }

    async getMultiLocation(query: InventoryQueryDto = {}) {
        const { data } = await this.findAll(query);
        const rules = await this.stockRulesService.findAll();
        const stockByLocation = Object.values(
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
        const overstock = stockByLocation.filter((location) => {
            const rule = resolveStockRule(
                {
                    sourceId: location.sourceId,
                    brand: location.brand,
                    model: location.model,
                    type: '',
                    exteriorColor: location.exteriorColor,
                    warehouse: location.warehouse,
                },
                rules,
            );
            return location.currentStock > rule.maxStock;
        });
        const understock = stockByLocation.filter((location) => {
            const rule = resolveStockRule(
                {
                    sourceId: location.sourceId,
                    brand: location.brand,
                    model: location.model,
                    type: '',
                    exteriorColor: location.exteriorColor,
                    warehouse: location.warehouse,
                },
                rules,
            );
            return location.currentStock < rule.minStock;
        });

        return {
            stockByLocation,
            transferTracking: [],
            transferTrackingMessage:
                'Not available from current data: no historical warehouse/source changes are present.',
            rebalancingRecommendations: overstock.flatMap((from) =>
                understock
                    .filter(
                        (to) =>
                            to.model === from.model &&
                            to.exteriorColor === from.exteriorColor &&
                            to.warehouse !== from.warehouse,
                    )
                    .map((to) => ({
                        brand: from.brand,
                        model: from.model,
                        exteriorColor: from.exteriorColor,
                        fromWarehouse: from.warehouse,
                        toWarehouse: to.warehouse,
                        fromSourceName: from.sourceName,
                        toSourceName: to.sourceName,
                        suggestedTransferQuantity: Math.max(
                            1,
                            Math.min(from.currentStock - 1, 1),
                        ),
                    })),
            ),
        };
    }

    async getAlerts(query: InventoryQueryDto = {}) {
        const response = await this.findAll(query);
        const replenishment = await this.getReplenishment(query);
        const coverage = await this.getStockCoverage(query);
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
            ...replenishment
                .filter((item) => item.currentStock <= item.minStock)
                .map((item) => ({
                    id: `low-stock-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    title: 'Low Stock',
                    message: `${item.brand} ${item.model} ${item.exteriorColor} is below min stock (${item.currentStock}/${item.minStock}).`,
                    severity: 'critical',
                    branch: item.warehouse || item.sourceName || '',
                    createdAt: response.meta.generatedAt,
                })),
            ...replenishment
                .filter((item) => item.currentStock <= item.reorderPoint)
                .map((item) => ({
                    id: `reorder-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    title: 'Below Reorder Point',
                    message: `${item.brand} ${item.model} should be reordered. Suggested quantity: ${item.suggestedOrderQuantity}.`,
                    severity: 'warning',
                    branch: item.warehouse || item.sourceName || '',
                    createdAt: response.meta.generatedAt,
                })),
            ...coverage
                .filter((item) => item.status === 'danger' || item.status === 'overstock')
                .map((item) => ({
                    id: `coverage-${item.status}-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    title: item.status === 'danger' ? 'Coverage Danger' : 'Overstock',
                    message: `${item.brand} ${item.model} coverage is ${item.coverageMonths ?? 'not available'} months.`,
                    severity: item.status === 'danger' ? 'critical' : 'warning',
                    branch: item.warehouse || item.sourceName || '',
                    createdAt: response.meta.generatedAt,
                })),
            ...response.data
                .filter((item) => item.isReserved && reservationAgeDays(item) > 30)
                .slice(0, 25)
                .map((item) => ({
                    id: `old-reservation-${item.sourceId}-${item.chassis || item.itemCode}`,
                    title: 'Old Reservation',
                    message: `${item.brand} ${item.model} reservation is older than 30 days.`,
                    severity: 'warning',
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
    return getSoldLastDays(items, 90);
}

function getSoldLastDays(items: InventoryItem[], days: number): number {
    return sumQuantity(
        items.filter((item) => {
            if (!item.isSold || !item.arInvoiceDate) {
                return false;
            }

            const date = new Date(item.arInvoiceDate);
            if (Number.isNaN(date.getTime())) {
                return false;
            }

            return Date.now() - date.getTime() <= days * 86_400_000;
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

function urgencyRank(urgency: ReplenishmentSuggestion['urgency']): number {
    return { low: 0, medium: 1, high: 2, critical: 3 }[urgency];
}

function reservationAgeDays(item: InventoryItem): number {
    const rawDate = item.reserveDate || item.contractDate || item.createDate;
    const date = new Date(rawDate);
    if (!rawDate || Number.isNaN(date.getTime())) {
        return 0;
    }

    return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}
