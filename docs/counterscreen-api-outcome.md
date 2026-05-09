# CounterScreen API Outcome

## Purpose

This document records the actual observed response shape of the configured CounterScreen APIs. It is based on a live, sanitized inspection run that did not print raw business values.

Inspection script:

```txt
backend/scripts/inspect-counterscreen-shapes.ts
```

Command used:

```bash
COUNTERSCREEN_REJECT_UNAUTHORIZED=false npx tsx scripts/inspect-counterscreen-shapes.ts --compact
```

## Sources Checked

Checked at: `2026-05-07T10:30:04.133Z`

| sourceId | sourceName | country | full endpoint | status | record count | checkedAt |
| --- | --- | --- | --- | --- | ---: | --- |
| `baraka` | `البركة` | Jordan | `https://laithobaidi.b1pro.com:8099/CounterScreen?filter=All` | HTTP 200, JSON array | 65 | `2026-05-07T10:30:02.238Z` |
| `dania` | `دانية الضلال` | Jordan | `https://laithobaidi.b1pro.com:8091/CounterScreen?filter=All` | HTTP 200, JSON array | 2,068 | `2026-05-07T10:30:02.329Z` |
| `laith` | `الليث اللامع` | Saudi Arabia | `https://laithobaidi.b1pro.com:8090/CounterScreen?filter=All` | HTTP 200, JSON array | 1,667 | `2026-05-07T10:30:02.331Z` |
| `laithCars` | `الليث لتجارة السيارات` | Jordan | `https://laithobaidi.b1pro.com:8599/CounterScreen?filter=All` | HTTP 200, JSON array | 3,255 | `2026-05-07T10:30:02.333Z` |

## Summary

The four APIs return the same general CounterScreen shape, but the columns are not exactly identical.

- Union across all sources: 55 raw keys.
- Shared by all four sources: 53 raw keys.
- Source-specific keys: `U_MOBNUM` and `U_Tanazol`, present only on `laith`.
- All sources returned JSON arrays with HTTP 200 during the inspection.
- All sources had populated `AbsEntry`, `Chassis`, and `ItemCode`.
- `Chassis` is not unique within a source. It had duplicates in all four sources.
- `AbsEntry` was unique in `baraka`, `dania`, and `laith`, but had one duplicate in `laithCars`.

## Shared Columns

These 53 fields were found in all four sources:

```txt
A/RInvDate
AbsEntry
AdditionalRemark
APInvDate
APInvNo
ARInvNo
Bank
BankCode
BPLName
CardCode
Chassis
Chassis_Status
ContractDate
CreateDate
Customer Number
CustomerGroup
CustomerName
Ext. Color
GRPO_Date
Int
ItemCode
ItmsGrpCod
ListName_1
ListName_2
ListName_3
ListName_4
ListNum_1
ListNum_2
ListNum_3
ListNum_4
Model
Notes
PONo
Price_1
Price_2
Price_3
Price_4
Quantity
Ready
ReserveDate
SalesMan
SO Remarks
SoldPrice
Type
U_Brand
U_EngineNo
U_Estimated_TimeA
U_Model
U_Plate_Number
U_SE_LOC
Vat
Wheel
WhsName
```

## Source-Specific Differences

### `baraka`

- Missing compared to union: `U_MOBNUM`, `U_Tanazol`.
- Extra/source-only fields: none.
- Empty-heavy fields included `BPLName`, `Notes`, `U_EngineNo`, `U_Estimated_TimeA`, `U_Plate_Number`, `Wheel`, `Price_2`, `Price_3`, `Price_4`, `AdditionalRemark`.
- `Chassis` had 1 duplicate among 65 records.

### `dania`

- Missing compared to union: `U_MOBNUM`, `U_Tanazol`.
- Extra/source-only fields: none.
- Empty-heavy fields included `Quantity`, `WhsName`, `U_SE_LOC`, `Wheel`, `Notes`, `Price_2`, `Price_3`, `Price_4`, `U_EngineNo`, `U_Estimated_TimeA`, `U_Plate_Number`, `AdditionalRemark`.
- `Chassis` had 70 duplicates among 2,068 records.

### `laith`

- Missing compared to union: none.
- Extra/source-only fields: `U_MOBNUM`, `U_Tanazol`.
- Empty-heavy fields included `U_MOBNUM`, `Bank`, `BankCode`, `Notes`, `Price_2`, `Price_3`, `Price_4`, `U_EngineNo`, `U_Estimated_TimeA`, `U_Plate_Number`, `AdditionalRemark`.
- `Chassis` had 2 duplicates among 1,667 records.

### `laithCars`

- Missing compared to union: `U_MOBNUM`, `U_Tanazol`.
- Extra/source-only fields: none.
- Empty-heavy fields included `Price_1`, `Notes`, `Price_2`, `Price_3`, `Price_4`, `U_EngineNo`, `U_Estimated_TimeA`, `U_Plate_Number`, `AdditionalRemark`.
- `AbsEntry` had 1 duplicate among 3,255 records.
- `Chassis` had 2 duplicates among 3,255 records.

## Field Naming Notes

The raw API contains several field names that require bracket access or careful mapping:

| Raw field | Note |
| --- | --- |
| `Ext. Color` | Contains a dot and space. |
| `Customer Number` | Contains a space. |
| `A/RInvDate` | Contains a slash. |
| `SO Remarks` | Contains a space. |
| `Chassis_Status` | Uses underscore. |
| `GRPO_Date` | Uses underscore. |
| `U_*` fields | SAP user-defined fields. |

These names are consistent across the observed sources where present. `U_MOBNUM` and `U_Tanazol` are not present in the three Jordan sources other than `laith`.

## Data Type Observations

The API is mostly consistent in JSON types, but many fields are nullable or empty-heavy.

| raw field | observed type(s) | empty/null behavior | normalized field | recommended DB type |
| --- | --- | --- | --- | --- |
| `AbsEntry` | number | populated in all sources; one duplicate in `laithCars` | `absEntry` | `Int?`, indexed; not globally unique by itself |
| `Chassis` | string | populated in all sources; duplicates observed in every source | `chassis` | `String`, indexed; not unique |
| `ItemCode` | string | populated, heavily duplicated by design | `itemCode` | `String`, indexed |
| `Quantity` | number/null | often null; mapper defaults null/empty to `1` | `quantity` | `Int`; keep raw JSON because null has meaning |
| `Ready` | string | populated; not boolean-like under current parser observation | `ready` / `isReadyForSale` | `Boolean` after normalization |
| `Chassis_Status` | string | populated in all sources | `rawStatus`, `normalizedStatus`, `displayStatus` | `String` or enum after normalization |
| `GRPO_Date` | string/null | parseable date strings when present; empty varies by source | `grpoDate`, stock age input | `String` currently; consider parsed `DateTime?` companion later |
| `APInvDate` | string/null | parseable date strings when present | `apInvoiceDate`, stock age fallback | `String` currently; consider parsed `DateTime?` companion later |
| `A/RInvDate` | string/null | parseable date strings when present | `arInvoiceDate` | `String` currently; consider parsed `DateTime?` companion later |
| `CreateDate` | string/null | parseable date strings when present | `createDate`, stock age fallback | `String` currently; consider parsed `DateTime?` companion later |
| `SoldPrice` | number/null | null for unsold or incomplete rows | `soldPrice` | `Float` or `Decimal`; mapper currently defaults null to `0` |
| `Vat` | number/null | null for many rows | `vat` | `Float` or `Decimal`; mapper currently defaults null to `0` |
| `Price_1` | number/null | source-dependent; almost empty in `laithCars` | `price1` | `Float?` or `Decimal?` |
| `Price_2` / `Price_3` / `Price_4` | null mostly/all | empty in observed run | `price2` / `price3` / `price4` | `Float?` or `Decimal?` |
| `PONo` | number/null | present as numeric JSON where populated | `poNo` | `String` after normalization |
| `BankCode` | number/null | empty-heavy; sensitive-adjacent | `bankCode` | `String` after normalization |
| `U_Model` | string/null but numeric-like | mostly year values | `modelYear` | `String` |
| `Ext. Color` | string/null | mostly populated | `exteriorColor` | `String` or nullable string |
| `BPLName` | string/null | empty in `baraka`, populated elsewhere | `branch` | `String` or nullable string |
| `WhsName` | string/null | often empty | `warehouse` | `String` or nullable string |
| `U_SE_LOC` | string/null | present in all sources but not mapped | none | Add nullable string only if business needs it |
| `U_MOBNUM` | string/null | `laith` only, 94.66% empty; sensitive phone-like field | none | Keep raw JSON only unless explicitly needed |
| `U_Tanazol` | string/null | `laith` only, 63.41% empty | none | Add nullable string only if business needs it |

## Mapper Coverage

| raw field | normalized field | mapper status |
| --- | --- | --- |
| `AbsEntry` | `absEntry` | covered |
| `Chassis` | `chassis` | covered |
| `ItemCode` | `itemCode` | covered |
| `Model` | `model` | covered |
| `ItmsGrpCod` | `itemGroupCode` | covered |
| `Type` | `type` | covered |
| `U_Model` | `modelYear` | covered |
| `Ext. Color` | `exteriorColor` | covered |
| `Int` | `interiorColor` | covered |
| `Wheel` | `wheel` | covered |
| `Notes` | `notes` | covered |
| `Quantity` | `quantity` | partially covered; null becomes `1` |
| `BPLName` | `branch` | covered, but empty in `baraka` |
| `Ready` | `ready`, `isReadyForSale` | covered; verify actual ready values before extending parser |
| `U_Brand` | `brand` | covered |
| `U_EngineNo` | `engineNo` | covered but almost always empty |
| `Price_1` - `Price_4` | `price1` - `price4` | covered |
| `ListNum_1` - `ListNum_4` | `listNum1` - `listNum4` | covered |
| `ListName_1` - `ListName_4` | `listName1` - `listName4` | covered |
| `PONo` | `poNo` | covered |
| `U_Estimated_TimeA` | `estimatedArrival` | covered but empty in observed run |
| `GRPO_Date` | `grpoDate`, stock age input | covered |
| `SalesMan` | `salesMan` | covered |
| `A/RInvDate` | `arInvoiceDate` | covered |
| `SoldPrice` | `soldPrice` | partially covered; null becomes `0` |
| `Vat` | `vat` | partially covered; null becomes `0` |
| `CustomerName` | `customerName` | covered |
| `CustomerGroup` | `customerGroup` | covered |
| `U_Plate_Number` | `plateNumber` | covered but almost always empty |
| `APInvDate` | `apInvoiceDate`, stock age input | covered |
| `APInvNo` | `apInvoiceNo` | covered |
| `Chassis_Status` | `rawStatus`, `normalizedStatus`, `displayStatus`, status booleans | covered |
| `ARInvNo` | `arInvoiceNo` | covered |
| `CardCode` | `cardCode` | covered |
| `CreateDate` | `createDate`, stock age input | covered |
| `WhsName` | `warehouse` | covered |
| `Bank` | `bank` | covered |
| `BankCode` | `bankCode` | covered |
| `ContractDate` | `contractDate` | covered |
| `ReserveDate` | `reserveDate` | covered |
| `Customer Number` | `customerNumber` | covered |
| `SO Remarks` | `soRemarks` | covered |
| `AdditionalRemark` | `additionalRemark` | covered |
| `U_SE_LOC` | none | missing/unused |
| `U_MOBNUM` | none | unused; probably intentionally raw-only because it is phone-like/sensitive |
| `U_Tanazol` | none | missing/unused for `laith` only |

The mapper covers all 53 shared fields except `U_SE_LOC`. It does not cover the two `laith`-only fields.

## Database Implications

One shared `InventoryItem` table is still the correct reporting shape. Four separate tables are unnecessary because 53 of 55 observed keys are shared and the source-specific fields can be handled as nullable columns or left in raw JSON.

The current Prisma model includes the normalized fields required by the frontend and stores source-identifying fields:

- `sourceId`
- `sourceName`
- `sourceCountry`
- `sourceBaseUrl`

Raw JSON is no longer stored permanently in the reporting database. When mapper or source-shape debugging is needed, use the inspection scripts to fetch live CounterScreen payloads directly.

The old raw-record storage was useful for audit and mapper evolution, but it retained too much full API payload data for the current reporting flow. Sync observability now comes from `InventorySyncRun.totalRawRecords` and `InventorySourceSyncResult.recordsCount`.

Nullability should be reviewed. Many raw fields are nullable, but the normalized Prisma model stores many as non-null `String` because the mapper converts missing/null values to empty strings. This preserves the current frontend shape, but it makes it harder to distinguish "missing" from "present but empty" in reporting queries.

Unique key findings:

| candidate key within source | observed result |
| --- | --- |
| `sourceId + chassis` | not safe; duplicates observed in all four sources |
| `sourceId + absEntry` | mostly safe, but `laithCars` had one duplicate |
| `sourceId + absEntry + chassis` | still had one duplicate in `laithCars` |
| `sourceId + absEntry + chassis + itemCode` | still had one duplicate in `laithCars` |

The current reporting sync preserves duplicate rows by replacing each successful source with every row returned by that source. `inventoryKey` is technical row identity built from `sourceId`, source row index, and a hash of the raw row excluding sensitive fields.

## Risks

- `sourceId + chassis` is not unique, so chassis-based upserts can overwrite rows.
- `AbsEntry` is not perfectly unique in the observed `laithCars` response.
- Several raw fields are numeric in JSON but normalized as strings, such as `PONo`, `APInvNo`, `ARInvNo`, and `BankCode`.
- Date fields are strings/null and should not be assumed to be present.
- `Quantity`, `SoldPrice`, and `Vat` nulls are converted to defaults, which may hide unknown values.
- `Ready` is a string field; the current boolean parser may need verification against actual values before relying on `isReadyForSale`.
- `Price_2`, `Price_3`, `Price_4`, `U_Estimated_TimeA`, and several other fields are empty-heavy.
- TLS verification is disabled for inspection when `COUNTERSCREEN_REJECT_UNAUTHORIZED=false`; this matches current integration needs but should be treated as an operational risk.

## Recommendations

1. Keep sync identity independent from chassis. Do not use `sourceId + chassis` as a unique key. The current generated `inventoryKey` preserves duplicates by using source, row index, and a non-sensitive row hash.
2. Add mapper support for `U_SE_LOC` if it has business meaning. It appears in all four sources.
3. Keep `U_MOBNUM` raw-only unless there is a specific feature need; it appears phone-like and sensitive.
4. Decide whether `U_Tanazol` should be normalized for the Saudi source.
5. Consider adding parsed date companion columns later, for example `grpoDateParsed DateTime?`, while preserving raw strings.
6. Consider using `Decimal` for money-like fields if exact financial reporting is required.
7. Revisit nullability in `InventoryItem`. Keep the frontend response shape stable, but store nullable DB columns where missing vs empty matters.
8. Keep raw API inspection outside the database. Inspection scripts can fetch live CounterScreen payloads when mapper evolution or source-specific field analysis is needed.
