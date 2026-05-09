import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { COUNTERSCREEN_SOURCES } from '../src/integrations/counterscreen/counterscreen.sources';

interface DuplicateRow {
    rowIndex: number;
    absEntry: string;
    arInvoiceDate: string;
    arInvoiceNo: string;
    apInvoiceNo: string;
    branch: string;
    brand: string;
    contractDate: string;
    itemCode: string;
    model: string;
    poNo: string;
    quantity: string;
    ready: string;
    reserveDate: string;
    salesMan: string;
    chassisStatus: string;
    warehouse: string;
    createDate: string;
    grpoDate: string;
    apInvoiceDate: string;
}

interface DuplicateGroup {
    maskedChassis: string;
    duplicateCount: number;
    rows: DuplicateRow[];
}

interface SourceReport {
    sourceId: string;
    sourceName: string;
    country: string;
    endpoint: string;
    ok: boolean;
    status: number | null;
    totalRecords: number;
    missingChassisRecords: number;
    duplicateChassisGroups: number;
    totalRowsInDuplicateGroups: number;
    duplicates: DuplicateGroup[];
    error?: string;
}

const SHOW_FULL_CHASSIS = process.argv.includes('--show-full-chassis');
const outputFlagIndex = process.argv.indexOf('--output');
const timeoutMs = Number(process.env.COUNTERSCREEN_TIMEOUT_MS ?? 30_000);
const checkedAt = new Date().toISOString();
const outputPath =
    outputFlagIndex >= 0 ? process.argv[outputFlagIndex + 1] : undefined;
const reportPath = outputPath
    ? resolve(process.cwd(), '..', outputPath)
    : resolve(
          process.cwd(),
          '..',
          'docs',
          'counterscreen-duplicate-chassis-report.md',
      );
const reportDisplayPath =
    outputPath ?? 'docs/counterscreen-duplicate-chassis-report.md';

async function main() {
    const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (process.env.COUNTERSCREEN_REJECT_UNAUTHORIZED === 'false') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const reports = await Promise.all(
            COUNTERSCREEN_SOURCES.map((source) => inspectSource(source)),
        );
        const markdown = buildMarkdownReport(reports);

        await mkdir(dirname(reportPath), { recursive: true });
        await writeFile(reportPath, markdown);

        console.log('CounterScreen duplicate chassis report');
        console.log(`Checked at: ${checkedAt}`);
        for (const report of reports) {
            console.log(
                `${report.sourceId}: ${report.totalRecords} records, ${report.duplicateChassisGroups} duplicate chassis groups`,
            );
        }
        console.log('');
        console.log('Report written to:');
        console.log(reportDisplayPath);
    } finally {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
}

async function inspectSource(
    source: (typeof COUNTERSCREEN_SOURCES)[number],
): Promise<SourceReport> {
    const endpoint = `${source.baseUrl}/CounterScreen?filter=All`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const payload = (await response.json()) as unknown;
        const records = Array.isArray(payload)
            ? payload.filter(
                  (item): item is Record<string, unknown> =>
                      typeof item === 'object' && item !== null,
              )
            : [];
        const chassisGroups = groupByChassis(records);
        const duplicates = Array.from(chassisGroups.entries())
            .filter(([, rows]) => rows.length > 1)
            .map(([chassis, rows]) => ({
                duplicateCount: rows.length,
                maskedChassis: SHOW_FULL_CHASSIS
                    ? chassis
                    : maskChassis(chassis),
                rows,
            }));

        return {
            country: source.country,
            duplicateChassisGroups: duplicates.length,
            duplicates,
            endpoint,
            missingChassisRecords: records.filter((record) =>
                isEmpty(record.Chassis),
            ).length,
            ok: response.ok,
            sourceId: source.id,
            sourceName: source.name,
            status: response.status,
            totalRecords: records.length,
            totalRowsInDuplicateGroups: duplicates.reduce(
                (sum, group) => sum + group.duplicateCount,
                0,
            ),
        };
    } catch (error) {
        return {
            country: source.country,
            duplicateChassisGroups: 0,
            duplicates: [],
            endpoint,
            error:
                error instanceof Error ? error.message : 'Unknown fetch error',
            missingChassisRecords: 0,
            ok: false,
            sourceId: source.id,
            sourceName: source.name,
            status: null,
            totalRecords: 0,
            totalRowsInDuplicateGroups: 0,
        };
    } finally {
        clearTimeout(timeout);
    }
}

function groupByChassis(records: Record<string, unknown>[]) {
    const groups = new Map<string, DuplicateRow[]>();

    records.forEach((record, rowIndex) => {
        const chassis = toScalarString(record.Chassis);
        if (!chassis) {
            return;
        }

        const rows = groups.get(chassis) ?? [];
        rows.push({
            absEntry: toScalarString(record.AbsEntry),
            apInvoiceNo: toScalarString(record.APInvNo),
            apInvoiceDate: toScalarString(record.APInvDate),
            arInvoiceDate: toScalarString(record['A/RInvDate']),
            arInvoiceNo: toScalarString(record.ARInvNo),
            branch: toScalarString(record.BPLName),
            brand: toScalarString(record.U_Brand),
            chassisStatus: toScalarString(record.Chassis_Status),
            contractDate: toScalarString(record.ContractDate),
            createDate: toScalarString(record.CreateDate),
            grpoDate: toScalarString(record.GRPO_Date),
            itemCode: toScalarString(record.ItemCode),
            model: toScalarString(record.Model),
            poNo: toScalarString(record.PONo),
            quantity: toScalarString(record.Quantity),
            ready: toScalarString(record.Ready),
            reserveDate: toScalarString(record.ReserveDate),
            rowIndex,
            salesMan: toScalarString(record.SalesMan),
            warehouse: toScalarString(record.WhsName),
        });
        groups.set(chassis, rows);
    });

    return groups;
}

function maskChassis(chassis: string): string {
    const clean = chassis.trim();
    if (clean.length <= 2) {
        return '*'.repeat(clean.length);
    }

    if (clean.length <= 6) {
        return `${clean.slice(0, 1)}****${clean.slice(-1)}`;
    }

    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function buildMarkdownReport(reports: SourceReport[]) {
    const duplicatesFound = reports.some(
        (report) => report.duplicateChassisGroups > 0,
    );
    const command = SHOW_FULL_CHASSIS
        ? `COUNTERSCREEN_REJECT_UNAUTHORIZED=false npm run inspect:duplicate-chassis -- --show-full-chassis${outputPath ? ` --output ${outputPath}` : ''}`
        : 'COUNTERSCREEN_REJECT_UNAUTHORIZED=false npm run inspect:duplicate-chassis';

    return [
        '# CounterScreen Duplicate Chassis Investigation Report',
        '',
        '## Executive Summary',
        '',
        '- Duplicate `Chassis` values were found within the same CounterScreen source/API response.',
        '- This means the duplicates are not only across different companies.',
        '- Using `sourceId + chassis` as a unique database key is unsafe.',
        '- Reporting accuracy can be affected if duplicate rows are collapsed during sync.',
        '',
        '## Inspection Details',
        '',
        `- Command used: \`${command}\``,
        `- Checked at: \`${checkedAt}\``,
        `- Timeout: \`${timeoutMs}ms\``,
        `- Sources checked: ${reports.length}`,
        `- Full chassis numbers shown: ${SHOW_FULL_CHASSIS ? 'yes' : 'no'}`,
        '- Safety note: customer names, customer phone numbers, card codes, bank fields, and full raw JSON are excluded.',
        '',
        '## Summary Table',
        '',
        '| sourceId | sourceName | totalRecords | duplicateChassisGroups | rowsInDuplicateGroups |',
        '| --- | --- | ---: | ---: | ---: |',
        ...reports.map(
            (report) =>
                `| \`${escapeMarkdown(report.sourceId)}\` | \`${escapeMarkdown(report.sourceName)}\` | ${report.totalRecords} | ${report.duplicateChassisGroups} | ${report.totalRowsInDuplicateGroups} |`,
        ),
        '',
        '## Duplicate Chassis Details',
        '',
        ...reports.flatMap(formatSourceDetails),
        '## Conclusion',
        '',
        duplicatesFound
            ? 'Duplicates were found within the same source/API response. These are not only duplicates across different companies or sources.'
            : 'No duplicate chassis values were found within the checked source/API responses.',
        '',
        duplicatesFound
            ? '`sourceId + chassis` is unsafe as a unique key for current inventory upserts.'
            : '`sourceId + chassis` did not show duplicates in this run, but it should still be monitored before enforcing a unique key.',
        '',
        '## Database Impact',
        '',
        '- `sourceId + chassis` cannot be used as a unique key.',
        '- Chassis-based upsert can collapse duplicate rows.',
        '- Collapsing rows can affect stock count, VIN report, sales status, reservation status, and dashboard totals.',
        '',
        '## Questions For Responsible Team',
        '',
        '- Should a chassis appear more than once in the same CounterScreen source?',
        '- If yes, what do the duplicate rows represent?',
        '- If no, which system should clean or prevent them?',
        '- What is the official unique identifier for a CounterScreen row?',
        '- Is `AbsEntry` supposed to be unique per source?',
        '- Should the dashboard count all duplicate chassis rows or only one row per chassis?',
        '',
        '## Recommended Temporary Handling',
        '',
        '- Preserve every row returned by the API.',
        '- Do not collapse by chassis.',
        '- Do not use chassis as the database unique key.',
        '- Use a technical row key for reporting sync until the official business key is confirmed.',
        '',
        '## Appendix',
        '',
        `- Command used: \`${command}\``,
        '- Script path: `backend/scripts/report-duplicate-chassis.ts`',
        `- Generated timestamp: \`${checkedAt}\``,
        '- Source endpoints:',
        ...reports.map(
            (report) =>
                `  - \`${escapeMarkdown(report.sourceId)}\`: \`${escapeMarkdown(report.endpoint)}\``,
        ),
        '',
    ].join('\n');
}

function formatSourceDetails(source: SourceReport) {
    if (!source.ok) {
        return [
            `### \`${escapeMarkdown(source.sourceId)}\``,
            '',
            `Request failed: ${escapeMarkdown(source.error ?? 'Unknown error')}`,
            '',
        ];
    }

    if (source.duplicates.length === 0) {
        return [
            `### \`${escapeMarkdown(source.sourceId)}\``,
            '',
            'No duplicate chassis groups found.',
            '',
        ];
    }

    return [
        `### \`${escapeMarkdown(source.sourceId)}\``,
        '',
        ...source.duplicates.flatMap((group, index) => [
            `#### Duplicate Group ${index + 1}`,
            '',
            `- sourceId: \`${escapeMarkdown(source.sourceId)}\``,
            `- sourceName: \`${escapeMarkdown(source.sourceName)}\``,
            `- total records in source: ${source.totalRecords}`,
            `- chassis: \`${escapeMarkdown(group.maskedChassis)}\``,
            `- duplicateCount: ${group.duplicateCount}`,
            `- rowIndexes: ${group.rows.map((row) => row.rowIndex).join(', ')}`,
            '',
            '| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |',
            '| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
            ...group.rows.map(
                (row) =>
                    `| ${row.rowIndex} | ${cell(row.absEntry)} | ${cell(row.itemCode)} | ${cell(row.model)} | ${cell(row.brand)} | ${cell(row.chassisStatus)} | ${cell(row.warehouse)} | ${cell(row.branch)} | ${cell(row.quantity)} | ${cell(row.ready)} | ${cell(row.createDate)} | ${cell(row.grpoDate)} | ${cell(row.apInvoiceDate)} | ${cell(row.arInvoiceDate)} | ${cell(row.arInvoiceNo)} | ${cell(row.apInvoiceNo)} | ${cell(row.poNo)} | ${cell(row.reserveDate)} | ${cell(row.contractDate)} | ${cell(row.salesMan)} |`,
            ),
            '',
            '**Analysis**',
            '',
            ...analyzeDuplicateGroup(group),
            '',
        ]),
    ];
}

function analyzeDuplicateGroup(group: DuplicateGroup) {
    const rows = group.rows;
    const fieldsToCompare: Array<[keyof DuplicateRow, string]> = [
        ['absEntry', 'AbsEntry'],
        ['chassisStatus', 'status'],
        ['arInvoiceNo', 'AR invoice number'],
        ['apInvoiceNo', 'AP invoice number'],
        ['poNo', 'PO number'],
        ['createDate', 'CreateDate'],
        ['grpoDate', 'GRPO_Date'],
        ['apInvoiceDate', 'APInvDate'],
        ['arInvoiceDate', 'A/RInvDate'],
    ];
    const differences = fieldsToCompare
        .filter(([field]) => hasDifferentValues(rows, field))
        .map(([, label]) => label);
    const identical = rows.every((row) => rowsEqual(rows[0], row));

    return [
        `- Rows identical: ${identical ? 'yes' : 'no'}.`,
        `- Different AbsEntry values: ${hasDifferentValues(rows, 'absEntry') ? 'yes' : 'no'}.`,
        `- Different status values: ${hasDifferentValues(rows, 'chassisStatus') ? 'yes' : 'no'}.`,
        `- Different document numbers: ${['arInvoiceNo', 'apInvoiceNo', 'poNo'].some((field) => hasDifferentValues(rows, field as keyof DuplicateRow)) ? 'yes' : 'no'}.`,
        `- Different dates: ${['createDate', 'grpoDate', 'apInvoiceDate', 'arInvoiceDate', 'reserveDate', 'contractDate'].some((field) => hasDifferentValues(rows, field as keyof DuplicateRow)) ? 'yes' : 'no'}.`,
        `- Differing fields observed: ${differences.length > 0 ? differences.join(', ') : 'none in selected fields'}.`,
        '- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.',
    ];
}

function hasDifferentValues(rows: DuplicateRow[], field: keyof DuplicateRow) {
    return new Set(rows.map((row) => String(row[field] ?? ''))).size > 1;
}

function rowsEqual(first: DuplicateRow, second: DuplicateRow) {
    return JSON.stringify(first) === JSON.stringify(second);
}

function cell(value: string) {
    return escapeMarkdown(value || '-');
}

function isEmpty(value: unknown) {
    return toScalarString(value) === '';
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

function escapeMarkdown(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

void main();
