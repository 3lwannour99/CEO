# Data Architecture

CEOReport supports two inventory data modes and separates operational inventory data from reporting data.

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

The frontend never calls CounterScreen directly and does not choose between live data and database data. Mode selection is backend-only via environment variables.

## Inventory Data Modes

```txt
INVENTORY_DATA_MODE=database | live
INVENTORY_SYNC_ENABLED=true | false
```

Defaults:

```txt
INVENTORY_DATA_MODE=database
INVENTORY_SYNC_ENABLED=true
```

Mode behavior:

- `database`: scheduled/manual sync writes normalized rows into `InventoryItem`; reporting APIs read from DB.
- `live`: reporting APIs fetch fresh CounterScreen data directly and normalize in memory; no `InventoryItem` writes are performed by reporting requests.

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

The scheduled sync runs every minute by default when `INVENTORY_DATA_MODE=database` and `INVENTORY_SYNC_ENABLED=true`:

```txt
INVENTORY_SYNC_ENABLED=true
INVENTORY_SYNC_INTERVAL_CRON=*/1 * * * *
COUNTERSCREEN_TIMEOUT_MS=30000
```

Overlapping runs are prevented in process. If a sync is already running, the next scheduled run is skipped and logged.

If `INVENTORY_DATA_MODE=live`, scheduler logs and skips:

```txt
Inventory sync disabled because INVENTORY_DATA_MODE=live
```

If `INVENTORY_SYNC_ENABLED=false`, scheduler logs and skips:

```txt
Inventory sync disabled by INVENTORY_SYNC_ENABLED=false
```

## Manual Sync

Manual sync endpoints (database mode):

```txt
POST /api/inventory-sync/run
GET /api/inventory-sync/status
GET /api/inventory-sync/runs
```

These routes are protected by JWT authentication. `POST /api/inventory-sync/run` requires `inventory.sync`; status and run history require `inventory.view`.

In `live` mode, `POST /api/inventory-sync/run` is rejected with:

```txt
Inventory sync is disabled in live data mode.
```

## Authentication Model

CEOReport uses role-based access control:

```txt
User -> UserRole -> Role -> RolePermission -> Permission
```

The Prisma auth models live in separate files under `backend/prisma/schema`. Seed data creates `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `VIEWER`, plus the default permission keys used by backend route guards.

The public health endpoint remains unauthenticated. Reporting, inventory, sync, stock rules, snapshots, and users APIs require JWT access tokens and route permissions.

Authentication identity uses `username` + password. `email` remains in the user table as optional legacy metadata and is not used for login.

## Refresh Behavior

Normal dashboard requests read based on active mode.

In `database` mode, `refresh=true` is treated as an admin/manual refresh trigger:

```txt
GET /api/inventory?refresh=true
```

The backend runs a sync first, then returns database results. If the sync fails or partially fails, APIs still return the latest available database data and include sync/source errors in metadata.

In `live` mode, `refresh=true` bypasses CounterScreen cache and fetches fresh live data only; it does not trigger DB sync.

## API Metadata

Inventory list responses include mode-aware metadata:

```ts
{
  total: number;
  generatedAt: string;
  lastSyncedAt: string | null;
  fromCache: false;
  fromDatabase: true;
  dataMode: "database" | "live";
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

In `live` mode, reporting/history tables are not refreshed by inventory API requests. This mode is intended as a temporary low-DB-processing fallback and depends directly on CounterScreen availability.

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
