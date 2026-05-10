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
import {
    deriveLogisticsStatus,
    daysBetween,
    getOrderDate,
} from '../common/calculations/logistics';
import { resolveStockRule } from '../common/calculations/stock-rules';
import { getSalesKpis } from '../common/calculations/sales-metrics';
import { StockRulesService } from '../stock-rules/stock-rules.service';
import { CounterScreenService } from '../integrations/counterscreen/counterscreen.service.js';

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
            totalUnits: sumQuantity(currentStock),
            currentStockUnits: sumQuantity(currentStock),
            soldUnits: sumQuantity(sold),
            reservedUnits: sumQuantity(data.filter((item) => item.isReserved)),
            fastMovingUnits: sumQuantity(
                currentStock.filter((item) => item.movementCategory === 'fast'),
            ),
            mediumMovingUnits: sumQuantity(
                currentStock.filter(
                    (item) => item.movementCategory === 'medium',
                ),
            ),
            slowMovingUnits: sumQuantity(
                currentStock.filter((item) => item.movementCategory === 'slow'),
            ),
            unknownAgeUnits: sumQuantity(
                currentStock.filter(
                    (item) => item.movementCategory === 'unknown',
                ),
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
        const rules = await this.stockRulesService.findAll();

        return Object.values(
            groupBy(data, stockKey, (items) => {
                const sample = items[0];
                const rule = sample
                    ? resolveStockRule(sample, rules)
                    : resolveStockRule(
                          {
                              sourceId: '',
                              brand: '',
                              model: '',
                              type: '',
                              exteriorColor: '',
                              warehouse: '',
                          },
                          rules,
                      );
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
                groupBy(
                    inStock,
                    (item) => `${item.type}|${item.exteriorColor}`,
                    (items) => ({
                        type: items[0]?.type ?? '',
                        exteriorColor: items[0]?.exteriorColor ?? '',
                        units: sumQuantity(items),
                    }),
                ),
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
                    (item) =>
                        `${item.warehouse}|${item.type}|${item.exteriorColor}`,
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
        const soldByModel = new Map(
            byModel.map((item) => [`${item.brand}|${item.model}`, item]),
        );
        const stockedModels = Object.values(
            groupBy(
                data.filter((item) => item.isInStock),
                (item) => `${item.brand}|${item.model}`,
                (items) => {
                    const soldModel = soldByModel.get(
                        `${items[0]?.brand ?? ''}|${items[0]?.model ?? ''}`,
                    );
                    return {
                        brand: items[0]?.brand ?? '',
                        model: items[0]?.model ?? '',
                        unitsSold: soldModel?.unitsSold ?? 0,
                        revenue: soldModel?.revenue ?? 0,
                    };
                },
            ),
        );
        const lowestSellingModels = [
            ...new Map(
                [...byModel, ...stockedModels].map((item) => [
                    `${item.brand}|${item.model}`,
                    item,
                ]),
            ).values(),
        ]
            .sort(
                (a, b) =>
                    a.unitsSold - b.unitsSold || a.model.localeCompare(b.model),
            )
            .slice(0, 10);

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
            lowestSellingModels,
            averageMovement: round(
                kpis.soldUnits / Math.max(1, byModel.length),
            ),
            breakdownByModel: byModel,
            breakdownByType: Object.values(
                groupBy(
                    sold,
                    (item) => item.type || 'Unknown',
                    (items) => ({
                        type: items[0]?.type || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            breakdownByColor: Object.values(
                groupBy(
                    sold,
                    (item) => item.exteriorColor || 'Unknown',
                    (items) => ({
                        exteriorColor: items[0]?.exteriorColor || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            breakdownByBranch: Object.values(
                groupBy(
                    sold,
                    (item) => item.branch || 'Unknown',
                    (items) => ({
                        branch: items[0]?.branch || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
            breakdownByCountry: Object.values(
                groupBy(
                    sold,
                    (item) => item.sourceCountry || 'Unknown',
                    (items) => ({
                        country: items[0]?.sourceCountry || 'Unknown',
                        unitsSold: sumQuantity(items),
                    }),
                ),
            ),
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
                    .map((to) => {
                        const fromRule = resolveStockRule(
                            {
                                sourceId: from.sourceId,
                                brand: from.brand,
                                model: from.model,
                                type: '',
                                exteriorColor: from.exteriorColor,
                                warehouse: from.warehouse,
                            },
                            rules,
                        );
                        const toRule = resolveStockRule(
                            {
                                sourceId: to.sourceId,
                                brand: to.brand,
                                model: to.model,
                                type: '',
                                exteriorColor: to.exteriorColor,
                                warehouse: to.warehouse,
                            },
                            rules,
                        );
                        const surplus = Math.max(
                            0,
                            from.currentStock - fromRule.maxStock,
                        );
                        const shortage = Math.max(
                            0,
                            toRule.minStock - to.currentStock,
                        );

                        return {
                            brand: from.brand,
                            model: from.model,
                            exteriorColor: from.exteriorColor,
                            fromWarehouse: from.warehouse,
                            toWarehouse: to.warehouse,
                            fromSourceName: from.sourceName,
                            toSourceName: to.sourceName,
                            suggestedTransferQuantity: Math.min(
                                surplus,
                                shortage,
                            ),
                        };
                    })
                    .filter((item) => item.suggestedTransferQuantity > 0),
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
                type: 'sourceFailure',
                sourceId: error.sourceId,
                sourceName: error.sourceName,
                branch: error.sourceName,
                affectedUnits: 0,
                affectedCount: 0,
                sampleChassis: [],
                affectedChassis: [],
                affectedVehicles: [],
                recommendedAction:
                    'Check source API availability and retry sync.',
                createdAt: response.meta.generatedAt,
            })),
            ...groupAlertVehicles(
                response.data.filter(
                    (item) =>
                        item.movementCategory === 'slow' && item.isInStock,
                ),
                (item) =>
                    alertGroupKey(item, [
                        'source',
                        'brand',
                        'model',
                        'type',
                        'warehouse',
                    ]),
                (group) => {
                    const sample = group[0];
                    const ages = group
                        .map((item) => item.stockAgeDays)
                        .filter(
                            (value): value is number =>
                                typeof value === 'number',
                        );
                    return {
                        id: `slow-${alertGroupKey(sample, ['source', 'brand', 'model', 'type', 'warehouse'])}`,
                        type: 'slowStock',
                        title: 'Slow stock 90+ days',
                        message: `${sample?.brand ?? ''} ${sample?.model ?? ''} has ${sumQuantity(group)} slow-moving units.`,
                        severity: 'warning',
                        ...alertGroupFields(sample),
                        affectedUnits: sumQuantity(group),
                        affectedCount: sumQuantity(group),
                        affectedVehicles: group,
                        affectedChassis: chassisSamples(
                            group,
                            Number.MAX_SAFE_INTEGER,
                        ),
                        sampleChassis: chassisSamples(group, 5),
                        metrics: {
                            oldestStockAgeDays:
                                ages.length > 0 ? Math.max(...ages) : null,
                            averageStockAgeDays:
                                ages.length > 0
                                    ? round(
                                          ages.reduce(
                                              (sum, value) => sum + value,
                                              0,
                                          ) / ages.length,
                                      )
                                    : null,
                        },
                        recommendedAction:
                            'Review pricing, transfer, or promotion plan.',
                        createdAt: response.meta.generatedAt,
                    };
                },
            ),
            ...groupAlertVehicles(
                response.data.filter(
                    (item) =>
                        item.movementCategory === 'unknown' && item.isInStock,
                ),
                (item) =>
                    alertGroupKey(item, [
                        'source',
                        'brand',
                        'model',
                        'warehouse',
                    ]),
                (group) => {
                    const sample = group[0];
                    return {
                        id: `unknown-age-${alertGroupKey(sample, ['source', 'brand', 'model', 'warehouse'])}`,
                        type: 'unknownAge',
                        title: 'Unknown stock age',
                        message: `${sample?.brand ?? ''} ${sample?.model ?? ''} has ${sumQuantity(group)} units without usable stock age.`,
                        severity: 'info',
                        ...alertGroupFields(sample),
                        affectedUnits: sumQuantity(group),
                        affectedCount: sumQuantity(group),
                        affectedVehicles: group,
                        affectedChassis: chassisSamples(
                            group,
                            Number.MAX_SAFE_INTEGER,
                        ),
                        sampleChassis: chassisSamples(group, 5),
                        recommendedAction:
                            'Validate GRPO, AP invoice, or create date.',
                        createdAt: response.meta.generatedAt,
                    };
                },
            ),
            ...replenishment
                .filter((item) => item.currentStock <= item.minStock)
                .map((item) => ({
                    id: `low-stock-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    type: 'lowStock',
                    title: 'Low Stock',
                    message: `${item.brand} ${item.model} ${item.exteriorColor} is below min stock (${item.currentStock}/${item.minStock}).`,
                    severity: 'warning',
                    branch: item.warehouse || item.sourceName || '',
                    sourceId: item.sourceId,
                    sourceName: item.sourceName,
                    brand: item.brand,
                    model: item.model,
                    typeName: item.type,
                    warehouse: item.warehouse,
                    affectedUnits: item.currentStock,
                    affectedCount: item.currentStock,
                    metrics: {
                        currentStock: item.currentStock,
                        minStock: item.minStock,
                    },
                    recommendedAction: item.reason,
                    createdAt: response.meta.generatedAt,
                })),
            ...replenishment
                .filter((item) => item.currentStock <= item.reorderPoint)
                .map((item) => ({
                    id: `reorder-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    type: 'belowReorderPoint',
                    title: 'Below Reorder Point',
                    message: `${item.brand} ${item.model} should be reordered. Suggested quantity: ${item.suggestedOrderQuantity}.`,
                    severity: 'critical',
                    branch: item.warehouse || item.sourceName || '',
                    sourceId: item.sourceId,
                    sourceName: item.sourceName,
                    brand: item.brand,
                    model: item.model,
                    typeName: item.type,
                    warehouse: item.warehouse,
                    affectedUnits: item.currentStock,
                    affectedCount: item.currentStock,
                    metrics: {
                        currentStock: item.currentStock,
                        reorderPoint: item.reorderPoint,
                        suggestedOrderQuantity: item.suggestedOrderQuantity,
                    },
                    recommendedAction: item.reason,
                    createdAt: response.meta.generatedAt,
                })),
            ...coverage
                .filter(
                    (item) =>
                        item.status === 'danger' || item.status === 'overstock',
                )
                .map((item) => ({
                    id: `coverage-${item.status}-${item.sourceId}-${item.model}-${item.exteriorColor}-${item.warehouse}`,
                    title:
                        item.status === 'danger'
                            ? 'Coverage Danger'
                            : 'Overstock',
                    message: `${item.brand} ${item.model} coverage is ${item.coverageMonths ?? 'not available'} months.`,
                    severity: item.status === 'danger' ? 'critical' : 'warning',
                    branch: item.warehouse || item.sourceName || '',
                    sourceId: item.sourceId,
                    sourceName: item.sourceName,
                    brand: item.brand,
                    model: item.model,
                    typeName: item.type,
                    warehouse: item.warehouse,
                    affectedUnits: item.currentStock,
                    affectedCount: item.currentStock,
                    metrics: {
                        coverageMonths: item.coverageMonths,
                        targetCoverageMonths: item.targetCoverageMonths,
                        currentStock: item.currentStock,
                        averageMonthlySales: item.averageMonthlySales,
                    },
                    recommendedAction: item.recommendedAction,
                    createdAt: response.meta.generatedAt,
                })),
            ...groupAlertVehicles(
                response.data.filter(
                    (item) => item.isReserved && reservationAgeDays(item) > 30,
                ),
                (item) =>
                    alertGroupKey(item, [
                        'source',
                        'brand',
                        'model',
                        'salesman',
                    ]),
                (group) => {
                    const sample = group[0];
                    const ages = group
                        .map(reservationAgeDays)
                        .filter((value) => value > 30);
                    return {
                        id: `old-reservation-${alertGroupKey(sample, ['source', 'brand', 'model', 'salesman'])}`,
                        type: 'oldReservation',
                        title: 'Old Reservation',
                        message: `${sample?.brand ?? ''} ${sample?.model ?? ''} has ${sumQuantity(group)} old reservations.`,
                        severity: 'warning',
                        ...alertGroupFields(sample),
                        affectedUnits: sumQuantity(group),
                        affectedCount: sumQuantity(group),
                        affectedVehicles: group,
                        affectedChassis: chassisSamples(
                            group,
                            Number.MAX_SAFE_INTEGER,
                        ),
                        sampleChassis: chassisSamples(group, 5),
                        metrics: {
                            oldestReservationAgeDays:
                                ages.length > 0 ? Math.max(...ages) : null,
                            averageReservationAgeDays:
                                ages.length > 0
                                    ? round(
                                          ages.reduce(
                                              (sum, value) => sum + value,
                                              0,
                                          ) / ages.length,
                                      )
                                    : null,
                        },
                        recommendedAction:
                            'Follow up with sales team and customer.',
                        createdAt: response.meta.generatedAt,
                    };
                },
            ),
        ];

        return alerts
            .sort(
                (left, right) =>
                    severityRank(String(right.severity)) -
                        severityRank(String(left.severity)) ||
                    (Number(right.affectedUnits) || 0) -
                        (Number(left.affectedUnits) || 0),
            )
            .slice(0, 100);
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
        recipientName: row.recipientName,
        recipientNumber: row.recipientNumber,
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
        uMobNum: row.uMobNum,
        uTanazol: row.uTanazol,
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
        item.recipientName,
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

function severityRank(severity: string): number {
    return { success: 0, info: 1, warning: 2, critical: 3 }[severity] ?? 0;
}

function groupAlertVehicles(
    items: InventoryItem[],
    keyFactory: (item: InventoryItem) => string,
    mapper: (items: InventoryItem[]) => Record<string, unknown>,
) {
    return Object.values(groupBy(items, keyFactory, mapper));
}

function alertGroupFields(item?: InventoryItem) {
    return {
        branch: item?.branch || item?.sourceName || '',
        sourceId: item?.sourceId,
        sourceName: item?.sourceName,
        brand: item?.brand,
        model: item?.model,
        typeName: item?.type,
        warehouse: item?.warehouse,
        status: item?.displayStatus || item?.normalizedStatus,
    };
}

function alertGroupKey(
    item: InventoryItem | undefined,
    parts: Array<
        'source' | 'brand' | 'model' | 'type' | 'warehouse' | 'salesman'
    >,
): string {
    if (!item) {
        return 'unknown';
    }

    return parts
        .map((part) => {
            if (part === 'source') {
                return item.sourceId || item.sourceName || 'Unknown';
            }
            if (part === 'salesman') {
                return item.salesMan || 'Unknown';
            }
            return item[part] || 'Unknown';
        })
        .join('|');
}

function chassisSamples(items: InventoryItem[], limit: number): string[] {
    return Array.from(
        new Set(items.map((item) => item.chassis).filter(Boolean)),
    ).slice(0, limit);
}

function reservationAgeDays(item: InventoryItem): number {
    const rawDate = item.reserveDate || item.contractDate || item.createDate;
    const date = new Date(rawDate);
    if (!rawDate || Number.isNaN(date.getTime())) {
        return 0;
    }

    return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}
