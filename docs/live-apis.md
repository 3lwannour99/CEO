# Live APIs and Data Shapes

This document describes the inventory APIs used by the app, where their data comes from, and the response shapes exposed to the frontend.

CounterScreen/SAP is the operational source of truth. PostgreSQL is the reporting source of truth. Normal frontend requests read from backend APIs backed by PostgreSQL reporting tables; CounterScreen is called only by backend sync logic. See `docs/data-architecture.md` for the sync architecture and `docs/counterscreen-api-outcome.md` for the latest observed raw API shape.

## Runtime Base URLs

Frontend requests use:

```txt
NEXT_PUBLIC_API_BASE_URL || http://localhost:4000/api
```

The NestJS backend sets the global API prefix to `/api`, so backend routes are exposed as:

```txt
http://localhost:4000/api/{route}
```

Swagger is available at:

```txt
http://localhost:4000/swagger
```

## Operational Data Sources

The operational inventory data comes from the CounterScreen integration. The backend sync job fetches these sources and stores raw and normalized reporting data in PostgreSQL.

Each source is fetched from:

```txt
{baseUrl}/CounterScreen?filter=All
```

Current configured sources:

| Source ID | Name | Country | Base URL |
| --- | --- | --- | --- |
| `baraka` | `البركة` | Jordan | `https://laithobaidi.b1pro.com:8099` |
| `dania` | `دانية الضلال` | Jordan | `https://laithobaidi.b1pro.com:8091` |
| `laith` | `الليث اللامع` | Saudi Arabia | `https://laithobaidi.b1pro.com:8090` |
| `laithCars` | `الليث لتجارة السيارات` | Jordan | `https://laithobaidi.b1pro.com:8599` |

Latest inspected outcome: all four endpoints returned HTTP 200 JSON arrays. They share 53 raw columns. The Saudi `laith` source also returned `U_MOBNUM` and `U_Tanazol`; the other three sources did not. `Chassis` is not unique within a source, so it should not be used alone for sync upserts.

Source config is defined in:

```txt
backend/src/integrations/counterscreen/counterscreen.sources.ts
```

## External CounterScreen Raw Shape

Each CounterScreen source is expected to return a JSON array:

```json
[
  {
    "AbsEntry": 123,
    "Chassis": "VIN123",
    "ItemCode": "ITEM-001",
    "Model": "Model Name",
    "ItmsGrpCod": 100,
    "Type": "SUV",
    "U_Model": "2026",
    "Ext. Color": "White",
    "Int": "Black",
    "Wheel": "LHD",
    "Notes": "",
    "Quantity": 1,
    "BPLName": "Main Branch",
    "Ready": "Y",
    "U_Brand": "Brand",
    "U_EngineNo": "ENGINE123",
    "Price_1": 10000,
    "ListNum_1": 1,
    "ListName_1": "Retail",
    "PONo": "PO-001",
    "U_Estimated_TimeA": "2026-05-15",
    "GRPO_Date": "2026-05-01",
    "SalesMan": "Salesperson",
    "A/RInvDate": "2026-05-03",
    "SoldPrice": 12000,
    "Vat": 0,
    "CustomerName": "Customer",
    "CustomerGroup": "Retail",
    "U_Plate_Number": "12345",
    "APInvDate": "2026-04-25",
    "APInvNo": "AP-001",
    "Chassis_Status": "In-Stock",
    "ARInvNo": "AR-001",
    "CardCode": "C001",
    "CreateDate": "2026-04-20",
    "WhsName": "Warehouse",
    "Bank": "Bank Name",
    "BankCode": "BANK",
    "ContractDate": "",
    "ReserveDate": "",
    "Customer Number": "",
    "SO Remarks": "",
    "AdditionalRemark": ""
  }
]
```

The backend treats each raw row as `Record<string, unknown>`, then normalizes it in:

```txt
backend/src/integrations/counterscreen/counterscreen.mapper.ts
```

## Normalized Inventory Item

Most frontend APIs are based on this normalized inventory shape:

```ts
interface InventoryItem {
  absEntry: number | null;
  chassis: string;
  itemCode: string;
  model: string;
  itemGroupCode: number | null;
  type: string;
  modelYear: string;
  exteriorColor: string;
  interiorColor: string;
  wheel: string;
  notes: string;
  quantity: number;
  branch: string;
  ready: boolean;
  brand: string;
  engineNo: string;
  poNo: string;
  estimatedArrival: string;
  grpoDate: string;
  salesMan: string;
  arInvoiceDate: string;
  soldPrice: number;
  vat: number;
  customerName: string;
  customerGroup: string;
  plateNumber: string;
  apInvoiceDate: string;
  apInvoiceNo: string;
  chassisStatus: string;
  displayStatus: string;
  normalizedStatus: string;
  arInvoiceNo: string;
  cardCode: string;
  createDate: string;
  warehouse: string;
  bank: string;
  bankCode: string;
  contractDate: string;
  reserveDate: string;
  customerNumber: string;
  soRemarks: string;
  additionalRemark: string;
  sourceId: string;
  sourceName: string;
  sourceCountry: string;
  sourceBaseUrl: string;
  stockAgeDays: number | null;
  movementCategory: "fast" | "medium" | "slow" | "unknown";
  isSold: boolean;
  isReserved: boolean;
  isInStock: boolean;
  isReadyForSale: boolean;
  rawStatus: string;
}
```

The full frontend type is in:

```txt
frontend/src/types/inventory.ts
```

## Shared Metadata Shape

List-style API responses include metadata about source success, cache state, and source errors.

```ts
interface ApiMeta {
  total: number;
  generatedAt: string;
  lastSyncedAt: string | null;
  fromCache: boolean;
  fromDatabase: boolean;
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

Example:

```json
{
  "meta": {
    "total": 250,
    "generatedAt": "2026-05-07T10:15:00.000Z",
    "lastSyncedAt": "2026-05-07T10:14:00.000Z",
    "fromCache": false,
    "fromDatabase": true,
    "syncStatus": "partial_success",
    "sourceCount": 4,
    "successfulSources": 3,
    "failedSources": 1,
    "errors": [
      {
        "sourceId": "baraka",
        "sourceName": "البركة",
        "message": "Source API unavailable"
      }
    ]
  }
}
```

## Sync and Refresh

CounterScreen is not called during normal dashboard reads. A backend sync job updates PostgreSQL every minute by default.

Request timeout per source:

```txt
COUNTERSCREEN_TIMEOUT_MS || 30000
```

To force fresh data, pass:

```txt
refresh=true
```

Example:

```txt
GET /api/inventory?refresh=true
```

`refresh=true` triggers a backend sync first, then returns PostgreSQL data. If sync fails, the API still returns the latest available database data and includes the sync/source errors in metadata.

## Query Filters

These filters are accepted by inventory-backed APIs:

| Filter | Meaning |
| --- | --- |
| `sourceId` | Match one source, for example `baraka` |
| `brand` | Exact brand match |
| `model` | Partial model match |
| `color` | Partial exterior color match |
| `branch` | Exact branch match |
| `warehouse` | Exact warehouse match |
| `status` | Match normalized/display/raw status |
| `movementCategory` | `fast`, `medium`, `slow`, or `unknown` |
| `ready` | `true`, `1`, `yes`, `false`, etc. |
| `search` | Searches chassis, item code, model, brand, colors, branch, warehouse, customer, and salesman |
| `refresh` | `true`, `1`, or `yes` bypasses cache |

## API Endpoints

### Health

```txt
GET /api/health
```

Returns basic app health from `AppService`.

### Sources

```txt
GET /api/sources
```

Returns configured CounterScreen sources.

```ts
CounterScreenSource[]
```

### Inventory

```txt
GET /api/inventory
```

Returns normalized inventory items.

```ts
{
  data: InventoryItem[];
  meta: ApiMeta;
}
```

### Raw Inventory

```txt
GET /api/inventory/raw
GET /api/inventory/raw?sourceId=baraka
```

Raw inventory record storage is disabled. This endpoint is retained for compatibility and returns an empty data array plus a clear disabled message. Use backend inspection scripts to fetch live CounterScreen payloads directly when raw API debugging is needed.

```ts
{
  data: [];
  message: string;
  meta: Omit<ApiMeta, "total"> & {
    totalRawRecords: number;
  };
}
```

### Inventory Summary

```txt
GET /api/inventory/summary
```

Returns aggregate inventory metrics.

```ts
interface InventorySummary {
  totalRows: number;
  uniqueChassisCount: number;
  multiStatusChassisCount: number;
  rowsInMultiStatusChassisGroups: number;
  totalUnits: number;
  currentStockUnits: number;
  soldUnits: number;
  reservedUnits: number;
  fastMovingUnits: number;
  mediumMovingUnits: number;
  slowMovingUnits: number;
  unknownAgeUnits: number;
  inTransitUnits: number;
  readyForSaleUnits: number;
  stockCoverageMonths: number | null;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    country: string;
    totalUnits: number;
    currentStockUnits: number;
  }>;
}
```

### Dashboard Summary

```txt
GET /api/dashboard/summary
```

Returns the combined dashboard payload: metrics, status summary, top sellers, slow stock, alerts, stock by location, sales snapshot, logistics snapshot, and metadata.

### Alerts

```txt
GET /api/alerts
```

Returns generated alerts.

Alert sources:

- CounterScreen source API failures
- Slow in-stock inventory over 90 days
- In-stock inventory with unknown stock age

```ts
interface InventoryAlert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | "success";
  branch: string;
  createdAt: string;
}
```

### Replenishment

```txt
GET /api/replenishment
```

Returns suggested order quantities grouped by brand, model, and exterior color.

```ts
interface ReplenishmentSuggestion {
  brand: string;
  model: string;
  exteriorColor: string;
  currentStock: number;
  soldLast90Days: number;
  averageMonthlySales: number;
  suggestedOrderQuantity: number;
  reorderPoint: number;
}
```

### Stock Coverage

```txt
GET /api/stock-coverage
```

Returns replenishment suggestions plus coverage months and stock status.

```ts
interface StockCoverageItem extends ReplenishmentSuggestion {
  coverageMonths: number | null;
  status: "danger" | "healthy" | "overstock" | "unknown";
}
```

### Sales Performance

```txt
GET /api/sales-performance
```

Returns sales rollups for sold inventory.

```ts
interface SalesPerformanceResponse {
  soldUnitsByModel: Array<{
    model: string;
    brand: string;
    unitsSold: number;
    revenue: number;
  }>;
  soldUnitsByBranch: Array<{ branch: string; unitsSold: number }>;
  soldUnitsBySource: Array<{
    sourceId: string;
    sourceName: string;
    country: string;
    unitsSold: number;
  }>;
  soldRevenue: number;
  customerGroupBreakdown: Array<{
    customerGroup: string;
    unitsSold: number;
  }>;
  topSellingModels: Array<{
    model: string;
    brand: string;
    unitsSold: number;
    revenue: number;
  }>;
  lowestSellingModels: Array<{
    model: string;
    brand: string;
    unitsSold: number;
    revenue: number;
  }>;
}
```

### Aggregated Stock

```txt
GET /api/aggregated-stock
```

Returns current in-stock units grouped by brand, model, and exterior color.

```ts
interface AggregatedStockItem {
  brand: string;
  model: string;
  exteriorColor: string;
  units: number;
}
```

### VIN Report

```txt
GET /api/aggregated-stock/vins
```

Returns the normalized `InventoryItem[]` list. This is used as a detailed VIN-level report.

### Multi Location

```txt
GET /api/multi-location
```

Returns current in-stock units grouped by source, branch, warehouse, brand, model, and exterior color.

```ts
interface LocationStock {
  sourceId: string;
  sourceName: string;
  country: string;
  branch: string;
  warehouse: string;
  brand: string;
  model: string;
  exteriorColor: string;
  currentStock: number;
}
```

### Logistics

```txt
GET /api/logistics
```

Returns inventory rows that have logistics-related data such as PO number, estimated arrival, GRPO date, or AP invoice date.

```ts
interface LogisticsStatus {
  poNo: string;
  estimatedArrival: string;
  grpoDate: string;
  apInvoiceDate: string;
  branch: string;
  warehouse: string;
  sourceId: string;
  sourceName: string;
  status: "Sold" | "In Transit" | "Warehouse" | "Unknown" | string;
  units: number;
}
```

### Multi Status Chassis

```txt
GET /api/inventory/multi-status-chassis
```

Returns grouped rows where a single chassis within a single source has multiple distinct raw or normalized statuses.

```ts
interface MultiStatusChassisGroup {
  sourceId: string;
  sourceName: string;
  chassis: string;
  rowCount: number;
  statuses: string[];
  rows: InventoryItem[];
}
```

## Where The Code Lives

| Concern | File |
| --- | --- |
| Backend bootstrap | `backend/src/main.ts` |
| API route modules | `backend/src/app.module.ts` |
| CounterScreen source list | `backend/src/integrations/counterscreen/counterscreen.sources.ts` |
| CounterScreen fetching/cache/error handling | `backend/src/integrations/counterscreen/counterscreen.service.ts` |
| Raw-to-normalized mapping | `backend/src/integrations/counterscreen/counterscreen.mapper.ts` |
| Shared backend inventory logic | `backend/src/inventory/inventory.service.ts` |
| Frontend API client | `frontend/src/lib/apiClient.ts` |
| Frontend API calls | `frontend/src/services/*.ts` |
| Frontend response types | `frontend/src/types/inventory.ts` |

## Inventory Row Identity Notes

- CounterScreen duplicate chassis rows can be valid business-state rows.
- `/api/inventory` and `/api/reports/aggregated-stock/vins` return row-level data and preserve duplicate chassis rows when present.
- `/api/inventory/summary` and `/api/dashboard/summary` include row-vs-chassis metrics.
- `/api/inventory/multi-status-chassis` lists per-source chassis groups with multiple rows/statuses.
