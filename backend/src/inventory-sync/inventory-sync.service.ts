import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mapCounterScreenItem } from '../integrations/counterscreen/counterscreen.mapper';
import { CounterScreenService } from '../integrations/counterscreen/counterscreen.service';
import {
    CounterScreenSource,
    RawCounterScreenItem,
} from '../integrations/counterscreen/counterscreen.types';
import { InventoryEventsService } from '../inventory-events/inventory-events.service';
import { getInventoryDataMode } from '../inventory/inventory-data-mode';
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
    private readonly batchSize = Number(
        process.env.INVENTORY_SYNC_BATCH_SIZE ?? 1000,
    );
    private readonly transactionTimeoutMs = Number(
        process.env.INVENTORY_SYNC_TRANSACTION_TIMEOUT_MS ?? 30_000,
    );
    private readonly transactionMaxWaitMs = Number(
        process.env.INVENTORY_SYNC_TRANSACTION_MAX_WAIT_MS ?? 10_000,
    );

    constructor(
        private readonly counterScreenService: CounterScreenService,
        private readonly inventoryEventsService: InventoryEventsService,
        private readonly prisma: PrismaService,
    ) {}

    async runSync(trigger: SyncTrigger = 'manual') {
        const mode = getInventoryDataMode();
        if (mode === 'live') {
            throw new ConflictException(
                'Inventory sync is disabled in live data mode.',
            );
        }

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
        const startedAtMs = Date.now();
        const initialMemory = formatMemoryUsage();
        const syncRun = await this.prisma.inventorySyncRun.create({
            data: {
                startedAt,
                status: 'running',
                totalSources: this.counterScreenService.getSources().length,
            },
        });

        try {
            this.logger.log(`Starting ${trigger} inventory sync ${syncRun.id}`);
            this.logger.log(
                `[sync ${syncRun.id}] memory before sync rss=${initialMemory.rssMb}MB heapUsed=${initialMemory.heapUsedMb}MB heapTotal=${initialMemory.heapTotalMb}MB`,
            );
            const syncedAt = new Date();
            const sourceStats: SourceSyncStats[] = [];
            const sources = this.counterScreenService.getSources();
            for (const source of sources) {
                sourceStats.push(
                    await this.syncSource(syncRun.id, source, syncedAt),
                );
            }
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
            const finalMemory = formatMemoryUsage();
            this.logger.log(
                `[sync ${syncRun.id}] completed status=${updatedRun.status} durationMs=${Date.now() - startedAtMs} rss=${finalMemory.rssMb}MB heapUsed=${finalMemory.heapUsedMb}MB heapTotal=${finalMemory.heapTotalMb}MB successfulSources=${updatedRun.successfulSources} failedSources=${updatedRun.failedSources}`,
            );

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

            const finalMemory = formatMemoryUsage();
            this.logger.error(
                `[sync ${syncRun.id}] failed durationMs=${Date.now() - startedAtMs} rss=${finalMemory.rssMb}MB heapUsed=${finalMemory.heapUsedMb}MB heapTotal=${finalMemory.heapTotalMb}MB`,
            );

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

    private async syncSource(
        syncRunId: string,
        source: CounterScreenSource,
        syncedAt: Date,
    ): Promise<SourceSyncStats> {
        const startedAt = new Date();
        const result = await this.counterScreenService.fetchSourceById(
            source.id,
        );

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
                result.source,
                raw,
                sourceRowIndex,
                syncedAt,
            ),
        );

        const normalizedCount = rows.length;
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

        const memory = formatMemoryUsage();
        this.logger.log(
            `[sync ${syncRunId}] source=${result.source.id} status=success records=${result.data.length} normalized=${normalizedCount} heapUsed=${memory.heapUsedMb}MB`,
        );

        return {
            errorMessage: null,
            normalizedCount,
            recordsCount: result.data.length,
            sourceId: result.source.id,
            status: 'success',
        };
    }

    private replaceSourceInventoryItems(
        sourceId: string,
        rows: ReturnType<typeof buildInventoryCreateInput>[],
    ): Promise<void> {
        return this.prisma.$transaction(
            async (tx) => {
                await tx.inventoryItem.deleteMany({
                    where: { sourceId },
                });

                for (
                    let start = 0;
                    start < rows.length;
                    start += this.batchSize
                ) {
                    const chunk = rows.slice(start, start + this.batchSize);
                    await tx.inventoryItem.createMany({
                        data: chunk,
                    });
                }
            },
            {
                maxWait: this.transactionMaxWaitMs,
                timeout: this.transactionTimeoutMs,
            },
        );
    }

    private async emitInventoryUpdated(
        syncRun: NonNullable<
            Awaited<ReturnType<InventorySyncService['getLatestRun']>>
        >,
    ) {
        const totalRows = await this.prisma.inventoryItem.count();
        const lastSyncedAt = syncRun.finishedAt ?? syncRun.startedAt;

        if (syncRun.status === 'running' || syncRun.status === 'failed') {
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
    source: CounterScreenSource,
    raw: RawCounterScreenItem,
    sourceRowIndex: number,
    syncedAt: Date,
) {
    const item = mapCounterScreenItem(raw, source);
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

function formatMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        heapTotalMb: toMb(usage.heapTotal),
        heapUsedMb: toMb(usage.heapUsed),
        rssMb: toMb(usage.rss),
    };
}

function toMb(bytes: number) {
    return Math.round((bytes / 1024 / 1024) * 10) / 10;
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
