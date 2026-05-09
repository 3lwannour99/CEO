import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { COUNTERSCREEN_SOURCES } from '../src/integrations/counterscreen/counterscreen.sources';

type Row = Record<string, unknown>;

interface SourceData {
    sourceId: string;
    sourceName: string;
    country: string;
    endpoint: string;
    ok: boolean;
    status: number | null;
    rows: Row[];
    error?: string;
}

interface Candidate {
    name: string;
    fields: string[];
    usesRowIndex?: boolean;
    usesRawHash?: boolean;
    usesSensitive?: boolean;
    stableBusiness?: boolean;
    keyBuilder: (ctx: KeyContext) => string;
}

interface KeyContext {
    row: Row;
    rowIndex: number;
    sourceId: string;
}

interface CandidateStats {
    unique: boolean;
    duplicateGroups: number;
    affectedRows: number;
    missingCount: number;
    duplicates: DuplicateExample[];
}

interface DuplicateExample {
    sourceId: string;
    candidateDisplayValue: string;
    duplicateCount: number;
    rowIndexes: number[];
    rows: ExampleRow[];
}

interface ExampleRow {
    rowIndex: number;
    absEntry: string;
    chassis: string;
    itemCode: string;
    model: string;
    chassisStatus: string;
    whsName: string;
    createDate: string;
    grpoDate: string;
    apInvDate: string;
    arInvDate: string;
    arInvNo: string;
    apInvNo: string;
    poNo: string;
    cardCodeMasked?: string;
}

interface CandidateScore {
    uniquenessScore: number;
    completenessScore: number;
    businessMeaningScore: number;
    stabilityRisk: string;
    privacyRisk: string;
    recommended: boolean;
    reason: string;
}

const SHOW_FULL_CHASSIS = process.argv.includes('--show-full-chassis');
const outputFlagIndex = process.argv.indexOf('--output');
const outputArg =
    outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : undefined;
const timeoutMs = Number(process.env.COUNTERSCREEN_TIMEOUT_MS ?? 30_000);
const checkedAt = new Date().toISOString();
const commandUsed = `COUNTERSCREEN_REJECT_UNAUTHORIZED=false npm run inspect:unique-keys -- --output ${outputArg ?? 'docs/counterscreen-unique-key-analysis.md'}${SHOW_FULL_CHASSIS ? ' --show-full-chassis' : ''}`;
const reportPath = outputArg
    ? resolve(process.cwd(), '..', outputArg)
    : resolve(
          process.cwd(),
          '..',
          'docs',
          'counterscreen-unique-key-analysis.md',
      );
const reportDisplayPath =
    outputArg ?? 'docs/counterscreen-unique-key-analysis.md';
const MAX_DUPLICATE_GROUPS_PER_CANDIDATE_PER_SOURCE = 3;
const SENSITIVE_KEYS = new Set([
    'CustomerName',
    'Customer Number',
    'U_MOBNUM',
    'Bank',
    'BankCode',
]);

const CANDIDATES: Candidate[] = [
    fieldCandidate('AbsEntry'),
    fieldCandidate('Chassis'),
    fieldCandidate('ItemCode'),
    fieldCandidate('PONo'),
    fieldCandidate('APInvNo'),
    fieldCandidate('ARInvNo'),
    fieldCandidate('CardCode', { usesSensitive: true }),
    fieldCandidate('U_EngineNo'),
    fieldCandidate('U_Plate_Number'),
    compositeCandidate('sourceId + AbsEntry', ['sourceId', 'AbsEntry']),
    compositeCandidate('sourceId + Chassis', ['sourceId', 'Chassis']),
    compositeCandidate('sourceId + AbsEntry + Chassis', [
        'sourceId',
        'AbsEntry',
        'Chassis',
    ]),
    compositeCandidate('sourceId + AbsEntry + ItemCode', [
        'sourceId',
        'AbsEntry',
        'ItemCode',
    ]),
    compositeCandidate('sourceId + AbsEntry + Chassis + ItemCode', [
        'sourceId',
        'AbsEntry',
        'Chassis',
        'ItemCode',
    ]),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Chassis_Status',
        ['sourceId', 'AbsEntry', 'Chassis', 'ItemCode', 'Chassis_Status'],
    ),
    compositeCandidate('sourceId + AbsEntry + Chassis + ItemCode + Model', [
        'sourceId',
        'AbsEntry',
        'Chassis',
        'ItemCode',
        'Model',
    ]),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName + CreateDate',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
            'CreateDate',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName + CreateDate + GRPO_Date',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
            'CreateDate',
            'GRPO_Date',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName + CreateDate + GRPO_Date + APInvDate',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
            'CreateDate',
            'GRPO_Date',
            'APInvDate',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName + CreateDate + GRPO_Date + APInvDate + A/RInvDate',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
            'CreateDate',
            'GRPO_Date',
            'APInvDate',
            'A/RInvDate',
        ],
    ),
    compositeCandidate(
        'sourceId + AbsEntry + Chassis + ItemCode + Model + Chassis_Status + WhsName + CreateDate + GRPO_Date + APInvDate + A/RInvDate + ARInvNo + APInvNo + PONo',
        [
            'sourceId',
            'AbsEntry',
            'Chassis',
            'ItemCode',
            'Model',
            'Chassis_Status',
            'WhsName',
            'CreateDate',
            'GRPO_Date',
            'APInvDate',
            'A/RInvDate',
            'ARInvNo',
            'APInvNo',
            'PONo',
        ],
    ),
    {
        name: 'sourceId + hash(full raw row excluding sensitive fields)',
        fields: ['sourceId', 'rowHashExcludingSensitive'],
        usesRawHash: true,
        stableBusiness: false,
        keyBuilder: ({ row, sourceId }) => joinParts([sourceId, hashRow(row)]),
    },
    {
        name: 'sourceId + rowIndex',
        fields: ['sourceId', 'rowIndex'],
        usesRowIndex: true,
        stableBusiness: false,
        keyBuilder: ({ sourceId, rowIndex }) =>
            joinParts([sourceId, String(rowIndex)]),
    },
    {
        name: 'sourceId + rowIndex + hash(full raw row excluding sensitive fields)',
        fields: ['sourceId', 'rowIndex', 'rowHashExcludingSensitive'],
        usesRowIndex: true,
        usesRawHash: true,
        stableBusiness: false,
        keyBuilder: ({ row, sourceId, rowIndex }) =>
            joinParts([sourceId, String(rowIndex), hashRow(row)]),
    },
];

function fieldCandidate(
    field: string,
    opts?: { usesSensitive?: boolean },
): Candidate {
    return {
        name: field,
        fields: [field],
        usesSensitive: Boolean(opts?.usesSensitive),
        stableBusiness: field === 'AbsEntry',
        keyBuilder: ({ row }) => joinParts([scalar(row[field])]),
    };
}

function compositeCandidate(name: string, fields: string[]): Candidate {
    return {
        name,
        fields,
        stableBusiness:
            fields.includes('AbsEntry') && !fields.includes('rowIndex'),
        keyBuilder: ({ row, sourceId }) =>
            joinParts(
                fields.map((field) =>
                    field === 'sourceId' ? sourceId : scalar(row[field]),
                ),
            ),
    };
}

async function main() {
    const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (process.env.COUNTERSCREEN_REJECT_UNAUTHORIZED === 'false') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const sources = await Promise.all(
            COUNTERSCREEN_SOURCES.map((source) => fetchSource(source)),
        );
        const successfulSources = sources.filter((source) => source.ok);

        const perSourceResults = new Map<string, Map<string, CandidateStats>>();
        for (const source of successfulSources) {
            const byCandidate = new Map<string, CandidateStats>();
            for (const candidate of CANDIDATES) {
                byCandidate.set(
                    candidate.name,
                    analyzeCandidateInSource(candidate, source),
                );
            }
            perSourceResults.set(source.sourceId, byCandidate);
        }

        const globalResults = new Map<string, CandidateStats>();
        for (const candidate of CANDIDATES) {
            globalResults.set(
                candidate.name,
                analyzeCandidateGlobally(candidate, successfulSources),
            );
        }

        const markdown = buildMarkdownReport({
            sources,
            perSourceResults,
            globalResults,
        });
        await mkdir(dirname(reportPath), { recursive: true });
        await writeFile(reportPath, markdown);

        console.log('CounterScreen unique key analysis');
        console.log(`Checked at: ${checkedAt}`);
        for (const source of sources) {
            console.log(
                `${source.sourceId}: ${source.rows.length} records${source.ok ? '' : ' (failed)'}`,
            );
        }
        console.log('Report written to:');
        console.log(reportDisplayPath);
    } finally {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
}

async function fetchSource(
    source: (typeof COUNTERSCREEN_SOURCES)[number],
): Promise<SourceData> {
    const endpoint = `${source.baseUrl}/CounterScreen?filter=All`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const payload = (await response.json()) as unknown;
        const rows = Array.isArray(payload)
            ? payload.filter(
                  (item): item is Row =>
                      typeof item === 'object' && item !== null,
              )
            : [];

        return {
            sourceId: source.id,
            sourceName: source.name,
            country: source.country,
            endpoint,
            ok: response.ok,
            status: response.status,
            rows,
        };
    } catch (error) {
        return {
            sourceId: source.id,
            sourceName: source.name,
            country: source.country,
            endpoint,
            ok: false,
            status: null,
            rows: [],
            error:
                error instanceof Error ? error.message : 'Unknown fetch error',
        };
    } finally {
        clearTimeout(timeout);
    }
}

function analyzeCandidateInSource(
    candidate: Candidate,
    source: SourceData,
): CandidateStats {
    const groups = new Map<string, number[]>();
    let missingCount = 0;

    source.rows.forEach((row, rowIndex) => {
        const key = candidate.keyBuilder({
            row,
            rowIndex,
            sourceId: source.sourceId,
        });
        if (key === '') {
            missingCount += 1;
            return;
        }
        const arr = groups.get(key) ?? [];
        arr.push(rowIndex);
        groups.set(key, arr);
    });

    const dupEntries = [...groups.entries()].filter(
        ([, idxs]) => idxs.length > 1,
    );
    const duplicates = dupEntries
        .slice(0, MAX_DUPLICATE_GROUPS_PER_CANDIDATE_PER_SOURCE)
        .map(([key, rowIndexes]) => ({
            sourceId: source.sourceId,
            candidateDisplayValue: sanitizeKeyValue(key, candidate),
            duplicateCount: rowIndexes.length,
            rowIndexes,
            rows: rowIndexes.map((idx) =>
                toExampleRow(
                    source.rows[idx],
                    idx,
                    candidate.fields.includes('CardCode'),
                ),
            ),
        }));

    return {
        unique: dupEntries.length === 0,
        duplicateGroups: dupEntries.length,
        affectedRows: dupEntries.reduce(
            (sum, [, idxs]) => sum + idxs.length,
            0,
        ),
        missingCount,
        duplicates,
    };
}

function analyzeCandidateGlobally(
    candidate: Candidate,
    sources: SourceData[],
): CandidateStats {
    const groups = new Map<
        string,
        Array<{ sourceId: string; rowIndex: number; row: Row }>
    >();
    let missingCount = 0;

    sources.forEach((source) => {
        source.rows.forEach((row, rowIndex) => {
            const key = candidate.keyBuilder({
                row,
                rowIndex,
                sourceId: source.sourceId,
            });
            if (key === '') {
                missingCount += 1;
                return;
            }
            const arr = groups.get(key) ?? [];
            arr.push({ sourceId: source.sourceId, rowIndex, row });
            groups.set(key, arr);
        });
    });

    const dupEntries = [...groups.entries()].filter(
        ([, items]) => items.length > 1,
    );
    const duplicates = dupEntries.slice(0, 5).map(([key, items]) => ({
        sourceId: 'global',
        candidateDisplayValue: sanitizeKeyValue(key, candidate),
        duplicateCount: items.length,
        rowIndexes: items.map((item) => item.rowIndex),
        rows: items.map((item) =>
            toExampleRow(
                item.row,
                item.rowIndex,
                candidate.fields.includes('CardCode'),
            ),
        ),
    }));

    return {
        unique: dupEntries.length === 0,
        duplicateGroups: dupEntries.length,
        affectedRows: dupEntries.reduce(
            (sum, [, items]) => sum + items.length,
            0,
        ),
        missingCount,
        duplicates,
    };
}

function buildMarkdownReport(input: {
    sources: SourceData[];
    perSourceResults: Map<string, Map<string, CandidateStats>>;
    globalResults: Map<string, CandidateStats>;
}) {
    const { sources, perSourceResults, globalResults } = input;
    const sourceRecordCounts = sources
        .map((source) => `${source.sourceId}: ${source.rows.length}`)
        .join(', ');
    const successfulSources = sources.filter((source) => source.ok);

    const scored = CANDIDATES.map((candidate) => {
        const global = globalResults.get(candidate.name)!;
        const allSourcesUnique = successfulSources.every(
            (source) =>
                perSourceResults.get(source.sourceId)?.get(candidate.name)
                    ?.unique === true,
        );
        const totalMissing = successfulSources.reduce(
            (sum, source) =>
                sum +
                (perSourceResults.get(source.sourceId)?.get(candidate.name)
                    ?.missingCount ?? 0),
            0,
        );
        const totalDupGroups = successfulSources.reduce(
            (sum, source) =>
                sum +
                (perSourceResults.get(source.sourceId)?.get(candidate.name)
                    ?.duplicateGroups ?? 0),
            0,
        );
        const score = scoreCandidate(
            candidate,
            allSourcesUnique,
            totalMissing,
            totalDupGroups,
        );

        return {
            candidate,
            allSourcesUnique,
            totalMissing,
            totalDupGroups,
            global,
            score,
        };
    });

    const recommended = scored
        .filter((item) => item.score.recommended)
        .sort((a, b) => totalScore(b.score) - totalScore(a.score))[0];

    const bestCandidateText = recommended
        ? `\`${recommended.candidate.name}\``
        : '`sourceId + rowIndex + hash(full raw row excluding sensitive fields)` (technical only)';

    const lines: string[] = [];
    lines.push('# CounterScreen Unique Key Analysis', '');
    lines.push(
        '## Purpose',
        'Identify the safest available unique identifier for each CounterScreen inventory row using live API data.',
        '',
    );
    lines.push('## Inspection Details');
    lines.push(`- Command used: \`${commandUsed}\``);
    lines.push(`- Checked at: \`${checkedAt}\``);
    lines.push(`- Sources checked: ${sources.length}`);
    lines.push(`- Record counts: ${sourceRecordCounts}`);
    lines.push('- Endpoint pattern: `{baseUrl}/CounterScreen?filter=All`');
    lines.push(`- Timeout: \`${timeoutMs}ms\``);
    lines.push(`- Full chassis shown: ${SHOW_FULL_CHASSIS ? 'yes' : 'no'}`);
    lines.push(
        '- Safety notes: customer/phone/bank/raw JSON excluded; CardCode masked when shown for CardCode candidate.',
        '',
    );

    lines.push('## Known Problem');
    lines.push(
        '- Duplicate chassis values exist within the same source/API response.',
    );
    lines.push('- Therefore `sourceId + chassis` is unsafe.', '');

    lines.push('## Candidate Key Summary');
    lines.push(
        '| candidate | fields used | unique in all sources | missing/empty count | duplicate groups | recommendation |',
    );
    lines.push('| --- | --- | --- | ---: | ---: | --- |');
    for (const item of scored) {
        lines.push(
            `| \`${escapeMd(item.candidate.name)}\` | \`${escapeMd(item.candidate.fields.join(' + '))}\` | ${item.allSourcesUnique ? 'yes' : 'no'} | ${item.totalMissing} | ${item.totalDupGroups} | ${item.score.recommended ? 'recommended' : 'not recommended'} |`,
        );
    }
    lines.push('');

    lines.push('## Per-Source Results');
    for (const source of sources) {
        lines.push(`### \`${escapeMd(source.sourceId)}\``);
        if (!source.ok) {
            lines.push(
                `- Request failed: ${escapeMd(source.error ?? 'Unknown error')}`,
                '',
            );
            continue;
        }
        lines.push(`- total records: ${source.rows.length}`);
        lines.push(
            '| candidate | unique | duplicate groups | affected rows | missing/empty key count | stable-looking or risky | suitable as DB unique key |',
        );
        lines.push('| --- | --- | ---: | ---: | ---: | --- | --- |');
        for (const candidate of CANDIDATES) {
            const stats = perSourceResults
                .get(source.sourceId)
                ?.get(candidate.name);
            if (!stats) continue;
            const stableText = candidate.usesRowIndex
                ? 'risky (order-dependent)'
                : candidate.usesRawHash
                  ? 'risky (value-change-sensitive)'
                  : candidate.stableBusiness
                    ? 'stable-looking'
                    : 'risky';
            const suitable =
                stats.unique &&
                stats.missingCount === 0 &&
                !candidate.usesSensitive &&
                !candidate.usesRowIndex &&
                !candidate.usesRawHash;
            lines.push(
                `| \`${escapeMd(candidate.name)}\` | ${stats.unique ? 'yes' : 'no'} | ${stats.duplicateGroups} | ${stats.affectedRows} | ${stats.missingCount} | ${stableText} | ${suitable ? 'yes' : 'no'} |`,
            );
        }
        lines.push('');
    }

    lines.push(
        '## Global Results (with sourceId included in candidate definition when applicable)',
    );
    lines.push(
        '| candidate | global unique | global duplicate groups | global affected rows | global missing/empty |',
    );
    lines.push('| --- | --- | ---: | ---: | ---: |');
    for (const candidate of CANDIDATES) {
        const stats = globalResults.get(candidate.name)!;
        lines.push(
            `| \`${escapeMd(candidate.name)}\` | ${stats.unique ? 'yes' : 'no'} | ${stats.duplicateGroups} | ${stats.affectedRows} | ${stats.missingCount} |`,
        );
    }
    lines.push('');

    lines.push('## Scoring');
    lines.push(
        '| candidate | uniqueness score | completeness score | business-meaning score | stability risk | privacy risk | recommended |',
    );
    lines.push('| --- | ---: | ---: | ---: | --- | --- | --- |');
    for (const item of scored) {
        lines.push(
            `| \`${escapeMd(item.candidate.name)}\` | ${item.score.uniquenessScore} | ${item.score.completenessScore} | ${item.score.businessMeaningScore} | ${item.score.stabilityRisk} | ${item.score.privacyRisk} | ${item.score.recommended ? 'yes' : 'no'} |`,
        );
    }
    lines.push('');

    lines.push('## Failed Candidate Examples');
    for (const source of successfulSources) {
        lines.push(`### \`${source.sourceId}\``);
        const failing = CANDIDATES.filter((candidate) => {
            const stats = perSourceResults
                .get(source.sourceId)
                ?.get(candidate.name);
            return stats && !stats.unique;
        });
        if (failing.length === 0) {
            lines.push('No failed candidates.', '');
            continue;
        }
        for (const candidate of failing) {
            const stats = perSourceResults
                .get(source.sourceId)
                ?.get(candidate.name);
            if (!stats) {
                continue;
            }
            lines.push(`#### Candidate: \`${candidate.name}\``);
            for (const dup of stats.duplicates) {
                lines.push(`- sourceId: \`${dup.sourceId}\``);
                lines.push(
                    `- candidate key display value: \`${escapeMd(dup.candidateDisplayValue)}\``,
                );
                lines.push(`- duplicate count: ${dup.duplicateCount}`);
                lines.push(`- row indexes: ${dup.rowIndexes.join(', ')}`);
                lines.push(
                    '| rowIndex | AbsEntry | Chassis | ItemCode | Model | Chassis_Status | WhsName | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo |',
                );
                lines.push(
                    '| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
                );
                for (const row of dup.rows) {
                    lines.push(
                        `| ${row.rowIndex} | ${cell(row.absEntry)} | ${cell(row.chassis)} | ${cell(row.itemCode)} | ${cell(row.model)} | ${cell(row.chassisStatus)} | ${cell(row.whsName)} | ${cell(row.createDate)} | ${cell(row.grpoDate)} | ${cell(row.apInvDate)} | ${cell(row.arInvDate)} | ${cell(row.arInvNo)} | ${cell(row.apInvNo)} | ${cell(row.poNo)} |`,
                    );
                }
                lines.push('');
            }
        }
    }

    lines.push('## Recommended Key');
    lines.push(`Best candidate from this run: ${bestCandidateText}.`);
    if (recommended) {
        lines.push(`- Reason: ${recommended.score.reason}`);
    } else {
        lines.push(
            '- No reliable real business key was unique and complete across all sources.',
        );
    }
    lines.push('');

    lines.push('## Database Recommendation');
    lines.push('- Do not enforce `sourceId + chassis` as unique.');
    lines.push(
        '- Use technical `inventoryKey` for sync identity if no confirmed SAP row key is available.',
    );
    lines.push(
        '- Upsert by business key is unsafe unless the API owner confirms and guarantees that key.',
    );
    lines.push(
        '- Replace-per-successful-source sync is safer than upsert on weak keys.',
        '',
    );

    lines.push('## Questions For SAP/API Owner');
    lines.push('- Is AbsEntry supposed to be unique per source?');
    lines.push('- Is there a document line key not exposed by the API?');
    lines.push(
        '- Is there a hidden internal row ID that can be added to the API?',
    );
    lines.push('- Should duplicate chassis rows be counted separately?');
    lines.push('- What is the official row identity in SAP/CounterScreen?');

    return lines.join('\n');
}

function scoreCandidate(
    candidate: Candidate,
    allSourcesUnique: boolean,
    totalMissing: number,
    totalDupGroups: number,
): CandidateScore {
    const uniquenessScore = allSourcesUnique ? 5 : 0;
    const completenessScore = totalMissing === 0 ? 3 : 0;
    const businessMeaningScore = candidate.stableBusiness ? 3 : 0;
    const stabilityPenalty =
        (candidate.usesRowIndex ? 2 : 0) + (candidate.usesRawHash ? 2 : 0);
    const privacyPenalty = candidate.usesSensitive ? 5 : 0;

    const disqualified = totalDupGroups > 0;
    const rawTotal =
        uniquenessScore +
        completenessScore +
        businessMeaningScore -
        stabilityPenalty -
        privacyPenalty;
    const recommended =
        !disqualified && rawTotal >= 8 && !candidate.usesSensitive;

    const stabilityRisk = candidate.usesRowIndex
        ? 'high (order can change)'
        : candidate.usesRawHash
          ? 'high (content drift changes key)'
          : allSourcesUnique
            ? 'low'
            : 'medium/high (observed duplicates)';

    const privacyRisk = candidate.usesSensitive
        ? 'high (contains sensitive field)'
        : 'low';

    const reason = disqualified
        ? 'Has duplicates in at least one source (disqualified for strict unique key).'
        : recommended
          ? 'Unique and complete across all checked sources with stable business identifiers.'
          : 'Technically useful but has stability/completeness/business-risk tradeoffs.';

    return {
        uniquenessScore,
        completenessScore,
        businessMeaningScore,
        stabilityRisk,
        privacyRisk,
        recommended,
        reason,
    };
}

function totalScore(score: CandidateScore) {
    return (
        score.uniquenessScore +
        score.completenessScore +
        score.businessMeaningScore
    );
}

function toExampleRow(
    row: Row,
    rowIndex: number,
    includeCardCode: boolean,
): ExampleRow {
    return {
        rowIndex,
        absEntry: scalar(row.AbsEntry),
        chassis: SHOW_FULL_CHASSIS
            ? scalar(row.Chassis)
            : maskChassis(scalar(row.Chassis)),
        itemCode: scalar(row.ItemCode),
        model: scalar(row.Model),
        chassisStatus: scalar(row.Chassis_Status),
        whsName: scalar(row.WhsName),
        createDate: scalar(row.CreateDate),
        grpoDate: scalar(row.GRPO_Date),
        apInvDate: scalar(row.APInvDate),
        arInvDate: scalar(row['A/RInvDate']),
        arInvNo: scalar(row.ARInvNo),
        apInvNo: scalar(row.APInvNo),
        poNo: scalar(row.PONo),
        cardCodeMasked: includeCardCode
            ? maskCardCode(scalar(row.CardCode))
            : undefined,
    };
}

function sanitizeKeyValue(value: string, candidate: Candidate) {
    if (candidate.name === 'CardCode') {
        return maskCardCode(value);
    }
    if (candidate.fields.includes('Chassis') && !SHOW_FULL_CHASSIS) {
        const parts = value.split('|');
        const masked = parts.map((part, idx) =>
            candidate.fields[idx] === 'Chassis' ? maskChassis(part) : part,
        );
        return masked.join('|');
    }
    return value;
}

function hashRow(row: Row) {
    const filtered = Object.fromEntries(
        Object.entries(row)
            .filter(([key]) => !SENSITIVE_KEYS.has(key) && key !== 'rawJson')
            .sort(([a], [b]) => a.localeCompare(b)),
    );

    return createHash('sha256')
        .update(JSON.stringify(filtered))
        .digest('hex')
        .slice(0, 16);
}

function maskChassis(chassis: string): string {
    const clean = chassis.trim();
    if (!clean) return '';
    if (clean.length <= 2) return '*'.repeat(clean.length);
    if (clean.length <= 6) return `${clean.slice(0, 1)}****${clean.slice(-1)}`;
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function maskCardCode(cardCode: string): string {
    const clean = cardCode.trim();
    if (!clean) return '';
    if (clean.length <= 2) return '*'.repeat(clean.length);
    return `${clean.slice(0, 2)}****${clean.slice(-1)}`;
}

function scalar(value: unknown): string {
    if (value === null || value === undefined) return '';
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

function joinParts(parts: string[]): string {
    if (parts.length === 0) return '';
    if (parts.every((part) => part === '')) return '';
    return parts.join('|');
}

function escapeMd(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function cell(value: string) {
    return escapeMd(value || '-');
}

void main();
