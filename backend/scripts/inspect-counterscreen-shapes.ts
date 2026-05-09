import { COUNTERSCREEN_SOURCES } from '../src/integrations/counterscreen/counterscreen.sources';

interface SourceShape {
    sourceId: string;
    sourceName: string;
    country: string;
    url: string;
    ok: boolean;
    status: number | null;
    responseType: string;
    contentType?: string;
    recordCount: number;
    checkedAt: string;
    firstRecordKeys: string[];
    keys: string[];
    missingKeys: string[];
    sourceOnlyKeys: string[];
    fieldStats: Record<
        string,
        {
            presentCount: number;
            emptyCount: number;
            emptyRatio: number;
            types: string[];
            dateLikeCount: number;
            numericLikeCount: number;
            booleanLikeCount: number;
        }
    >;
    keyUniqueness: Record<
        string,
        {
            populatedCount: number;
            uniqueCount: number;
            duplicateCount: number;
            emptyCount: number;
        }
    >;
    sanitizedSample?: Record<string, unknown>;
    error?: string;
}

const INCLUDE_SAMPLE = process.argv.includes('--sample');
const COMPACT = process.argv.includes('--compact');
const timeoutMs = Number(process.env.COUNTERSCREEN_TIMEOUT_MS ?? 30_000);

async function main() {
    const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (process.env.COUNTERSCREEN_REJECT_UNAUTHORIZED === 'false') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const sourceShapes = await Promise.all(
            COUNTERSCREEN_SOURCES.map((source) => inspectSource(source)),
        );
        const unionKeys = unique(sourceShapes.flatMap((shape) => shape.keys));
        const commonKeys = unionKeys.filter((key) =>
            sourceShapes.every((shape) => shape.keys.includes(key)),
        );
        const sourceCountByKey = Object.fromEntries(
            unionKeys.map((key) => [
                key,
                sourceShapes.filter((shape) => shape.keys.includes(key)).length,
            ]),
        );

        const completedShapes = sourceShapes.map((shape) => ({
            ...shape,
            missingKeys: unionKeys.filter((key) => !shape.keys.includes(key)),
            sourceOnlyKeys: shape.keys.filter(
                (key) => sourceCountByKey[key] === 1,
            ),
        }));

        const report = {
            checkedAt: new Date().toISOString(),
            timeoutMs,
            endpointPattern: '{baseUrl}/CounterScreen?filter=All',
            sources: completedShapes,
            unionKeys,
            commonKeys,
            differingKeys: unionKeys.filter((key) => !commonKeys.includes(key)),
        };

        console.log(
            JSON.stringify(COMPACT ? compactReport(report) : report, null, 2),
        );
    } finally {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
}

function compactReport(report: {
    checkedAt: string;
    timeoutMs: number;
    endpointPattern: string;
    sources: SourceShape[];
    unionKeys: string[];
    commonKeys: string[];
    differingKeys: string[];
}) {
    return {
        checkedAt: report.checkedAt,
        commonKeyCount: report.commonKeys.length,
        differingKeys: report.differingKeys,
        endpointPattern: report.endpointPattern,
        sourceCount: report.sources.length,
        sources: report.sources.map((source) => ({
            checkedAt: source.checkedAt,
            country: source.country,
            emptyHeavyFields: Object.entries(source.fieldStats)
                .filter(([, stats]) => stats.emptyRatio >= 0.9)
                .map(([key, stats]) => ({ key, emptyRatio: stats.emptyRatio })),
            firstRecordKeys: source.firstRecordKeys,
            keyCount: source.keys.length,
            keyIntegrity: getKeyIntegrity(source.fieldStats),
            keyUniqueness: source.keyUniqueness,
            missingKeys: source.missingKeys,
            ok: source.ok,
            recordCount: source.recordCount,
            requestUrl: source.url,
            responseType: source.responseType,
            sourceId: source.sourceId,
            sourceName: source.sourceName,
            sourceOnlyKeys: source.sourceOnlyKeys,
            status: source.status,
            typeObservations: pickTypeObservations(source.fieldStats),
        })),
        timeoutMs: report.timeoutMs,
        unionKeyCount: report.unionKeys.length,
        unionKeys: report.unionKeys,
    };
}

function getKeyIntegrity(fieldStats: SourceShape['fieldStats']) {
    return {
        absEntry: summarizeKeyField(fieldStats.AbsEntry),
        chassis: summarizeKeyField(fieldStats.Chassis),
        itemCode: summarizeKeyField(fieldStats.ItemCode),
    };
}

function summarizeKeyField(
    stats: SourceShape['fieldStats'][string] | undefined,
) {
    if (!stats) {
        return { presentCount: 0, emptyCount: 0, emptyRatio: 1, types: [] };
    }

    return {
        emptyCount: stats.emptyCount,
        emptyRatio: stats.emptyRatio,
        presentCount: stats.presentCount,
        types: stats.types,
    };
}

function pickTypeObservations(fieldStats: SourceShape['fieldStats']) {
    const fields = [
        'AbsEntry',
        'Chassis',
        'Quantity',
        'Ready',
        'Chassis_Status',
        'GRPO_Date',
        'APInvDate',
        'A/RInvDate',
        'CreateDate',
        'SoldPrice',
        'Vat',
        'Price_1',
        'PONo',
        'BankCode',
        'U_Model',
        'Ext. Color',
        'BPLName',
        'WhsName',
        'U_SE_LOC',
        'U_MOBNUM',
        'U_Tanazol',
    ];

    return Object.fromEntries(
        fields
            .filter((field) => fieldStats[field])
            .map((field) => [
                field,
                {
                    booleanLikeCount: fieldStats[field].booleanLikeCount,
                    dateLikeCount: fieldStats[field].dateLikeCount,
                    emptyRatio: fieldStats[field].emptyRatio,
                    numericLikeCount: fieldStats[field].numericLikeCount,
                    types: fieldStats[field].types,
                },
            ]),
    );
}

async function inspectSource(
    source: (typeof COUNTERSCREEN_SOURCES)[number],
): Promise<SourceShape> {
    const url = `${source.baseUrl}/CounterScreen?filter=All`;
    const checkedAt = new Date().toISOString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = (await response.json()) as unknown;
        const records = Array.isArray(payload)
            ? payload.filter(
                  (item): item is Record<string, unknown> =>
                      typeof item === 'object' && item !== null,
              )
            : [];
        const keys = unique(records.flatMap((record) => Object.keys(record)));

        return {
            checkedAt,
            country: source.country,
            fieldStats: collectFieldStats(records, keys),
            firstRecordKeys: Object.keys(records[0] ?? {}),
            keyUniqueness: collectKeyUniqueness(records),
            keys,
            missingKeys: [],
            ok: response.ok,
            recordCount: records.length,
            responseType: Array.isArray(payload) ? 'array' : typeof payload,
            sanitizedSample: INCLUDE_SAMPLE
                ? sanitizeRecord(records[0] ?? {})
                : undefined,
            sourceId: source.id,
            sourceName: source.name,
            sourceOnlyKeys: [],
            status: response.status,
            url,
            contentType: contentType || undefined,
        };
    } catch (error) {
        return {
            checkedAt,
            country: source.country,
            error:
                error instanceof Error ? error.message : 'Unknown fetch error',
            fieldStats: {},
            firstRecordKeys: [],
            keyUniqueness: {},
            keys: [],
            missingKeys: [],
            ok: false,
            recordCount: 0,
            responseType: 'error',
            sourceId: source.id,
            sourceName: source.name,
            sourceOnlyKeys: [],
            status: null,
            url,
        };
    } finally {
        clearTimeout(timeout);
    }
}

function collectFieldStats(records: Record<string, unknown>[], keys: string[]) {
    return Object.fromEntries(
        keys.map((key) => {
            const values = records.map((record) => record[key]);
            const presentValues = values.filter((value) => value !== undefined);
            const emptyCount = presentValues.filter(isEmpty).length;
            return [
                key,
                {
                    booleanLikeCount:
                        presentValues.filter(isBooleanLike).length,
                    dateLikeCount: presentValues.filter(isDateLike).length,
                    emptyCount,
                    emptyRatio:
                        presentValues.length > 0
                            ? Number(
                                  (emptyCount / presentValues.length).toFixed(
                                      4,
                                  ),
                              )
                            : 0,
                    numericLikeCount:
                        presentValues.filter(isNumericLike).length,
                    presentCount: presentValues.length,
                    types: unique(presentValues.map(getType)),
                },
            ];
        }),
    );
}

function collectKeyUniqueness(records: Record<string, unknown>[]) {
    return {
        absEntry: summarizeUniqueness(records.map((record) => record.AbsEntry)),
        absEntryChassis: summarizeUniqueness(
            records.map((record) => composite(record.AbsEntry, record.Chassis)),
        ),
        absEntryChassisItemCode: summarizeUniqueness(
            records.map((record) =>
                composite(record.AbsEntry, record.Chassis, record.ItemCode),
            ),
        ),
        chassis: summarizeUniqueness(records.map((record) => record.Chassis)),
        itemCode: summarizeUniqueness(records.map((record) => record.ItemCode)),
    };
}

function composite(...values: unknown[]) {
    if (values.every(isEmpty)) {
        return '';
    }

    return values.map(toScalarString).join('|');
}

function summarizeUniqueness(values: unknown[]) {
    const populated = values.map(toScalarString).filter(Boolean);
    const uniqueCount = new Set(populated).size;

    return {
        duplicateCount: populated.length - uniqueCount,
        emptyCount: values.length - populated.length,
        populatedCount: populated.length,
        uniqueCount,
    };
}

function sanitizeRecord(record: Record<string, unknown>) {
    const sensitivePattern =
        /chassis|customer|card|phone|mobile|bank|engine|plate|name|code|remarks?/i;

    return Object.fromEntries(
        Object.entries(record).map(([key, value]) => [
            key,
            sensitivePattern.test(key)
                ? maskValue(value)
                : describeValue(value),
        ]),
    );
}

function maskValue(value: unknown) {
    if (isEmpty(value)) {
        return value;
    }

    return `[masked ${getType(value)}]`;
}

function describeValue(value: unknown) {
    if (isEmpty(value)) {
        return value;
    }

    return `[${getType(value)}]`;
}

function isEmpty(value: unknown) {
    return (
        value === null || value === undefined || toScalarString(value) === ''
    );
}

function getType(value: unknown) {
    if (value === null) {
        return 'null';
    }

    if (Array.isArray(value)) {
        return 'array';
    }

    return typeof value;
}

function isNumericLike(value: unknown) {
    if (isEmpty(value)) {
        return false;
    }

    return Number.isFinite(Number(toScalarString(value).replace(/,/g, '')));
}

function isDateLike(value: unknown) {
    if (isEmpty(value)) {
        return false;
    }

    if (typeof value !== 'string') {
        return false;
    }

    if (!/[-/T:]/.test(value)) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
}

function isBooleanLike(value: unknown) {
    if (typeof value === 'boolean') {
        return true;
    }

    return ['y', 'yes', 'true', '1', 'ready', 'n', 'no', 'false', '0'].includes(
        toScalarString(value).toLowerCase(),
    );
}

function unique(values: string[]) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function toScalarString(value: unknown) {
    if (value === null || value === undefined) {
        return '';
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value).trim();
    }

    return '';
}

void main();
