import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mapCounterScreenItem } from '../integrations/counterscreen/counterscreen.mapper';
import { CounterScreenService } from '../integrations/counterscreen/counterscreen.service';
import {
    RawCounterScreenItem,
    SourceFetchResult,
} from '../integrations/counterscreen/counterscreen.types';
import { InventoryEventsService } from '../inventory-events/inventory-events.service';
import { PrismaService } from '../prisma/prisma.service';

type SyncTrigger = 'manual' | 'scheduled' | 'refresh';

type SourceSyncStats = {
    sourceId: string;
    status: 'success' | 'failed';
    recordsCount: number;
    normalizedCount: number;
    errorMessage: string | null;
};

@Injectable()
export class InventorySyncService {
    private readonly logger = new Logger(InventorySyncService.name);
    private isRunning = false;
    private runningStartedAt: string | null = null;

    constructor(
        private readonly counterScreenService: CounterScreenService,
        private readonly inventoryEventsService: InventoryEventsService,
        private readonly prisma: PrismaService,
    ) {}

    async runSync(trigger: SyncTrigger = 'manual') {
        if (this.isRunning) {
            return {
                skipped: true,
                reason: 'Inventory sync is already running.',
                runningStartedAt: this.runningStartedAt,
            };
        }

        this.isRunning = true;
        this.runningStartedAt = new Date().toISOString();
        const startedAt = new Date();
        const syncRun = await this.prisma.inventorySyncRun.create({
            data: {
                startedAt,
                status: 'running',
                totalSources: this.counterScreenService.getSources().length,
            },
        });

        try {
            this.logger.log(`Starting ${trigger} inventory sync ${syncRun.id}`);
            const results = await this.counterScreenService.fetchAllSources();
            const syncedAt = new Date();
            const sourceStats = await this.persistResults(
                syncRun.id,
                results,
                syncedAt,
            );
            const failedSources = sourceStats.filter(
                (item) => item.status === 'failed',
            ).length;
            const successfulSources = sourceStats.length - failedSources;
            const totalRawRecords = sourceStats.reduce(
                (sum, item) => sum + item.recordsCount,
                0,
            );
            const totalNormalizedRecords = sourceStats.reduce(
                (sum, item) => sum + item.normalizedCount,
                0,
            );
            const status =
                failedSources === 0
                    ? 'success'
                    : successfulSources > 0
                      ? 'partial_success'
                      : 'failed';
            const errorMessage =
                failedSources > 0
                    ? sourceStats
                          .filter((item) => item.errorMessage)
                          .map(
                              (item) =>
                                  `${item.sourceId}: ${item.errorMessage}`,
                          )
                          .join('; ')
                    : null;

            const updatedRun = await this.prisma.inventorySyncRun.update({
                where: { id: syncRun.id },
                data: {
                    finishedAt: new Date(),
                    status,
                    totalSources: sourceStats.length,
                    successfulSources,
                    failedSources,
                    totalRawRecords,
                    totalNormalizedRecords,
                    errorMessage,
                },
                include: { sourceResults: true },
            });

            await this.emitInventoryUpdated(updatedRun);

            return updatedRun;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown sync failure';
            this.logger.error(
                `Inventory sync ${syncRun.id} failed: ${message}`,
            );
            const failedRun = await this.prisma.inventorySyncRun.update({
                where: { id: syncRun.id },
                data: {
                    errorMessage: message,
                    failedSources:
                        this.counterScreenService.getSources().length,
                    finishedAt: new Date(),
                    status: 'failed',
                    totalSources: this.counterScreenService.getSources().length,
                },
                include: { sourceResults: true },
            });

            await this.emitInventoryUpdated(failedRun);

            return failedRun;
        } finally {
            this.isRunning = false;
            this.runningStartedAt = null;
        }
    }

    async getStatus() {
        const latestRun = await this.getLatestRun();
        return {
            isRunning: this.isRunning,
            runningStartedAt: this.runningStartedAt,
            latestRun,
        };
    }

    getRuns(limit = 25) {
        return this.prisma.inventorySyncRun.findMany({
            include: { sourceResults: true },
            orderBy: { startedAt: 'desc' },
            take: limit,
        });
    }

    getLatestRun() {
        return this.prisma.inventorySyncRun.findFirst({
            include: { sourceResults: true },
            orderBy: { startedAt: 'desc' },
        });
    }

    private async persistResults(
        syncRunId: string,
        results: SourceFetchResult[],
        syncedAt: Date,
    ) {
        const stats: SourceSyncStats[] = [];

        for (const result of results) {
            stats.push(await this.syncSource(syncRunId, result, syncedAt));
        }

        return stats;
    }

    private async syncSource(
        syncRunId: string,
        result: SourceFetchResult,
        syncedAt: Date,
    ): Promise<SourceSyncStats> {
        const startedAt = new Date();

        if (result.error) {
            await this.prisma.inventorySourceSyncResult.create({
                data: {
                    errorMessage: result.error.message,
                    finishedAt: new Date(),
                    recordsCount: 0,
                    sourceId: result.source.id,
                    sourceName: result.source.name,
                    startedAt,
                    status: 'failed',
                    syncRunId,
                },
            });

            return {
                errorMessage: result.error.message,
                normalizedCount: 0,
                recordsCount: 0,
                sourceId: result.source.id,
                status: 'failed',
            };
        }

        const rows = result.data.map((raw, sourceRowIndex) =>
            buildInventoryCreateInput(
                syncRunId,
                result,
                raw,
                sourceRowIndex,
                syncedAt,
            ),
        );

        await this.replaceSourceInventoryItems(result.source.id, rows);

        await this.prisma.inventorySourceSyncResult.create({
            data: {
                finishedAt: new Date(),
                recordsCount: result.data.length,
                sourceId: result.source.id,
                sourceName: result.source.name,
                startedAt,
                status: 'success',
                syncRunId,
            },
        });

        return {
            errorMessage: null,
            normalizedCount: rows.length,
            recordsCount: result.data.length,
            sourceId: result.source.id,
            status: 'success',
        };
    }

    private replaceSourceInventoryItems(
        sourceId: string,
        rows: ReturnType<typeof buildInventoryCreateInput>[],
    ) {
        return this.prisma.$transaction([
            this.prisma.inventoryItem.deleteMany({
                where: { sourceId },
            }),
            this.prisma.inventoryItem.createMany({
                data: rows,
            }),
        ]);
    }

    private async emitInventoryUpdated(
        syncRun: NonNullable<
            Awaited<ReturnType<InventorySyncService['getLatestRun']>>
        >,
    ) {
        const totalRows = await this.prisma.inventoryItem.count();
        const lastSyncedAt = syncRun.finishedAt ?? syncRun.startedAt;

        if (syncRun.status === 'running') {
            return;
        }

        this.inventoryEventsService.emitInventoryUpdated({
            failedSources: syncRun.failedSources,
            lastSyncedAt: lastSyncedAt.toISOString(),
            sourceResults: syncRun.sourceResults.map((sourceResult) => ({
                errorMessage: sourceResult.errorMessage ?? undefined,
                recordsCount: sourceResult.recordsCount,
                sourceId: sourceResult.sourceId,
                sourceName: sourceResult.sourceName,
                status: sourceResult.status,
            })),
            status: syncRun.status,
            successfulSources: syncRun.successfulSources,
            syncRunId: syncRun.id,
            totalNormalizedRecords: syncRun.totalNormalizedRecords,
            totalRawRecords: syncRun.totalRawRecords,
            totalRows,
        });
    }
}

function buildInventoryCreateInput(
    syncRunId: string,
    result: SourceFetchResult,
    raw: RawCounterScreenItem,
    sourceRowIndex: number,
    syncedAt: Date,
) {
    const item = mapCounterScreenItem(raw, result.source);
    const rowHash = generateRowHash(raw);

    return {
        ...item,
        businessStateKey: generateBusinessStateKey(item),
        firstSeenAt: syncedAt,
        inventoryKey: generateInventoryKey(
            item.sourceId,
            sourceRowIndex,
            rowHash,
        ),
        lastSeenAt: syncedAt,
        lastSyncedAt: syncedAt,
        rowHash,
        sourceRowIndex,
        syncRunId,
    };
}

function generateInventoryKey(
    sourceId: string,
    sourceRowIndex: number,
    rowHash: string,
): string {
    return `${sourceId}:${sourceRowIndex}:${rowHash}`;
}

function generateBusinessStateKey(
    item: ReturnType<typeof mapCounterScreenItem>,
): string {
    const payload = {
        sourceId: item.sourceId,
        chassis: item.chassis,
        absEntry: item.absEntry,
        itemCode: item.itemCode,
        model: item.model,
        rawStatus: item.rawStatus,
        normalizedStatus: item.normalizedStatus,
        displayStatus: item.displayStatus,
        warehouse: item.warehouse,
        branch: item.branch,
        createDate: item.createDate,
        grpoDate: item.grpoDate,
        apInvoiceDate: item.apInvoiceDate,
        arInvoiceDate: item.arInvoiceDate,
        reserveDate: item.reserveDate,
        contractDate: item.contractDate,
        arInvoiceNo: item.arInvoiceNo,
        apInvoiceNo: item.apInvoiceNo,
        poNo: item.poNo,
    };

    return createHash('sha256')
        .update(JSON.stringify(payload))
        .digest('hex')
        .slice(0, 32);
}

function generateRowHash(raw: RawCounterScreenItem): string {
    return createHash('sha256')
        .update(JSON.stringify(sanitizeRawRowForHash(raw)))
        .digest('hex')
        .slice(0, 16);
}

function sanitizeRawRowForHash(
    raw: RawCounterScreenItem,
): Record<string, unknown> {
    const excluded = new Set([
        'CustomerName',
        'Customer Number',
        'CardCode',
        'U_MOBNUM',
        'Bank',
        'BankCode',
    ]);
    const normalized = Object.fromEntries(
        Object.entries(raw)
            .filter(([key]) => !excluded.has(key))
            .sort(([left], [right]) => left.localeCompare(right)),
    );

    return normalized;
}
