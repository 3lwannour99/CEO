import { Injectable, Logger } from '@nestjs/common';
import { COUNTERSCREEN_SOURCES } from './counterscreen.sources';
import { mapCounterScreenItem } from './counterscreen.mapper';
import {
    CounterScreenSource,
    InventoryMeta,
    InventoryResponse,
    RawInventoryResponse,
    SourceError,
    SourceFetchResult,
} from './counterscreen.types';

interface CacheEntry {
    data: InventoryResponse;
    raw: RawInventoryResponse;
    expiresAt: number;
}

@Injectable()
export class CounterScreenService {
    private readonly logger = new Logger(CounterScreenService.name);
    private cache: CacheEntry | null = null;

    getSources(): CounterScreenSource[] {
        return COUNTERSCREEN_SOURCES;
    }

    async getInventory(refresh = false): Promise<InventoryResponse> {
        const now = Date.now();
        if (!refresh && this.cache && this.cache.expiresAt > now) {
            this.logger.log(
                `CounterScreen inventory cache hit (expiresInMs=${this.cache.expiresAt - now})`,
            );
            return {
                data: this.cache.data.data,
                meta: {
                    ...this.cache.data.meta,
                    fromCache: true,
                },
            };
        }

        const results = await this.fetchAllSources();
        const generatedAt = new Date().toISOString();
        const errors = results.flatMap((result) =>
            result.error ? [result.error] : [],
        );
        const data = results.flatMap((result) =>
            result.error
                ? []
                : result.data.map((item) =>
                      mapCounterScreenItem(item, result.source),
                  ),
        );
        const meta: InventoryMeta = {
            total: data.length,
            generatedAt,
            fromCache: false,
            sourceCount: COUNTERSCREEN_SOURCES.length,
            successfulSources: results.filter((result) => !result.error).length,
            failedSources: errors.length,
            errors,
        };
        const response = { data, meta };
        const raw = this.createRawResponse(results, generatedAt, false);
        this.cache = {
            data: response,
            raw,
            expiresAt: now + this.getCacheTtlMs(),
        };

        return response;
    }

    async getRawInventory(refresh = false): Promise<RawInventoryResponse> {
        const now = Date.now();
        if (!refresh && this.cache && this.cache.expiresAt > now) {
            this.logger.log(
                `CounterScreen raw inventory cache hit (expiresInMs=${this.cache.expiresAt - now})`,
            );
            return {
                ...this.cache.raw,
                meta: {
                    ...this.cache.raw.meta,
                    fromCache: true,
                },
            };
        }

        await this.getInventory(true);
        return (
            this.cache?.raw ??
            this.createRawResponse([], new Date().toISOString(), false)
        );
    }

    async fetchAllSources(): Promise<SourceFetchResult[]> {
        return Promise.all(
            COUNTERSCREEN_SOURCES.map((source) => this.fetchSource(source)),
        );
    }

    async fetchSourceById(sourceId: string): Promise<SourceFetchResult> {
        const source = COUNTERSCREEN_SOURCES.find(
            (item) => item.id === sourceId,
        );
        if (!source) {
            return {
                source: {
                    id: sourceId,
                    name: sourceId,
                    country: 'Unknown',
                    baseUrl: '',
                },
                data: [],
                error: {
                    sourceId,
                    sourceName: sourceId,
                    message: 'Source not found',
                },
            };
        }

        return this.fetchSource(source);
    }

    private async fetchSource(
        source: CounterScreenSource,
    ): Promise<SourceFetchResult> {
        const startedAtMs = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            this.getTimeoutMs(),
        );
        const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

        if (process.env.COUNTERSCREEN_REJECT_UNAUTHORIZED === 'false') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        try {
            const url = `${source.baseUrl}/CounterScreen?filter=All`;
            this.logger.log(
                `[CounterScreen] request start source=${source.id} url=${url}`,
            );
            const response = await fetch(url, { signal: controller.signal });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = (await response.json()) as unknown;
            if (!Array.isArray(payload)) {
                throw new Error('Unexpected response shape');
            }

            const records = payload.filter(
                (item): item is Record<string, unknown> =>
                    typeof item === 'object' && item !== null,
            );
            this.logger.log(
                `[CounterScreen] request success source=${source.id} status=${response.status} durationMs=${Date.now() - startedAtMs} records=${records.length}`,
            );
            return {
                source,
                data: records,
            };
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown source failure';
            this.logger.warn(
                `[CounterScreen] request failed source=${source.id} durationMs=${Date.now() - startedAtMs} error="${message}"`,
            );
            return {
                source,
                data: [],
                error: {
                    sourceId: source.id,
                    sourceName: source.name,
                    message: 'Source API unavailable',
                },
            };
        } finally {
            clearTimeout(timeout);
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
        }
    }

    private createRawResponse(
        results: SourceFetchResult[],
        generatedAt: string,
        fromCache: boolean,
    ): RawInventoryResponse {
        const errors: SourceError[] = results.flatMap((result) =>
            result.error ? [result.error] : [],
        );

        return {
            data: results.map((result) => ({
                source: result.source,
                records: result.data,
                error: result.error,
            })),
            meta: {
                generatedAt,
                fromCache,
                sourceCount: COUNTERSCREEN_SOURCES.length,
                successfulSources: results.filter((result) => !result.error)
                    .length,
                failedSources: errors.length,
                errors,
                totalRawRecords: results.reduce(
                    (sum, result) => sum + result.data.length,
                    0,
                ),
            },
        };
    }

    private getTimeoutMs(): number {
        return Number(process.env.COUNTERSCREEN_TIMEOUT_MS ?? 30_000);
    }

    private getCacheTtlMs(): number {
        return (
            Number(process.env.COUNTERSCREEN_CACHE_TTL_SECONDS ?? 300) * 1000
        );
    }
}
