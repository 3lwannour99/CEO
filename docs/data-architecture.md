# Data Architecture

CEOReport now separates operational inventory data from reporting data.

## Source Of Truth

CounterScreen/SAP remains the operational source of truth. It owns the live operational vehicle data.

The configured database is the reporting source of truth. Dashboard, report, alert, logistics, replenishment, and inventory APIs read from database reporting tables instead of calling CounterScreen during normal user requests. Local development supports PostgreSQL or MySQL through `DATABASE_PROVIDER`; when the variable is missing or empty, PostgreSQL is the default.

```txt
CounterScreen/SAP
-> Backend inventory sync job
-> database reporting tables
-> Backend APIs
-> Frontend dashboard
```

The frontend never calls CounterScreen directly and does not choose between live data and database data.

## Sync Job

The backend sync job lives in:

```txt
backend/src/inventory-sync
```

It:

- Fetches all configured CounterScreen sources.
- Normalizes records with the existing CounterScreen mapper.
- Replaces current reporting rows in `InventoryItem` for each successful source.
- Sets sync/audit timestamps on inserted reporting rows.
- Logs each run in `InventorySyncRun`.
- Logs source-level results in `InventorySourceSyncResult`.
- Supports partial success when some sources fail.

The observed CounterScreen shape is documented in `docs/counterscreen-api-outcome.md`. As of the latest inspection, all four sources are similar enough for one shared reporting table, but `Chassis` is not unique within a source and should not be used alone as the sync upsert key.

The scheduled sync runs every minute by default:

```txt
INVENTORY_SYNC_ENABLED=true
INVENTORY_SYNC_INTERVAL_CRON=*/1 * * * *
COUNTERSCREEN_TIMEOUT_MS=30000
```

Overlapping runs are prevented in process. If a sync is already running, the next scheduled run is skipped and logged.

## Manual Sync

Manual sync endpoints:

```txt
POST /api/inventory-sync/run
GET /api/inventory-sync/status
GET /api/inventory-sync/runs
```

No auth is currently required because the project does not have auth wired for these routes yet.

## Refresh Behavior

Normal dashboard requests read from the configured reporting database.

`refresh=true` is treated as an admin/manual refresh trigger:

```txt
GET /api/inventory?refresh=true
```

The backend runs a sync first, then returns database results. If the sync fails or partially fails, APIs still return the latest available database data and include sync/source errors in metadata.

## API Metadata

Inventory list responses include reporting metadata:

```ts
{
  total: number;
  generatedAt: string;
  lastSyncedAt: string | null;
  fromCache: false;
  fromDatabase: true;
  syncStatus: string;
  sourceCount: number;
  successfulSources: number;
  failedSources: number;
  errors: Array<{
    sourceId: string;
    sourceName: string;
    message: string;
  }>;
}
```

## Raw Records

Raw CounterScreen API payloads are not persisted in the reporting database. `InventoryItem` is the reporting source of truth, while `InventorySyncRun.totalRawRecords` and `InventorySourceSyncResult.recordsCount` keep sync counts for observability.

`GET /api/inventory/raw` is retained as a disabled compatibility endpoint. It returns no records and explains that raw record storage is disabled. Use inspection scripts to fetch live CounterScreen API payloads directly when debugging mapper or source issues.

## CounterScreen Row Identity Rule (2026-05-07)

- A chassis can appear multiple times in the same source when rows represent different business statuses/stages.
- `sourceId + chassis` is a grouping key only, not a unique identity.
- Database uniqueness uses technical `inventoryKey`.
- Business grouping uses `businessStateKey`.

Key strategy:
- `inventoryKey = sourceId + ":" + sourceRowIndex + ":" + rowHash`
- `businessStateKey = hash(sourceId + chassis + status/stage fields)`

Sync strategy:
- Replace per successful source.
- Preserve every row from the API response.
- Never collapse rows by chassis during sync.

Reporting metrics now distinguish:
- `totalRows`
- `uniqueChassisCount`
- `multiStatusChassisCount`
- `rowsInMultiStatusChassisGroups`
