# CounterScreen Duplicate Chassis Investigation Report

## Executive Summary

- Duplicate `Chassis` values were found within the same CounterScreen source/API response.
- This means the duplicates are not only across different companies.
- Using `sourceId + chassis` as a unique database key is unsafe.
- Reporting accuracy can be affected if duplicate rows are collapsed during sync.

## Inspection Details

- Command used: `COUNTERSCREEN_REJECT_UNAUTHORIZED=false npm run inspect:duplicate-chassis -- --show-full-chassis --output docs/counterscreen-duplicate-chassis-investigation-report.md`
- Checked at: `2026-05-07T10:52:55.723Z`
- Timeout: `30000ms`
- Sources checked: 4
- Full chassis numbers shown: yes
- Safety note: customer names, customer phone numbers, card codes, bank fields, and full raw JSON are excluded.

## Summary Table

| sourceId | sourceName | totalRecords | duplicateChassisGroups | rowsInDuplicateGroups |
| --- | --- | ---: | ---: | ---: |
| `baraka` | `البركة` | 65 | 1 | 2 |
| `dania` | `دانية الضلال` | 2068 | 70 | 140 |
| `laith` | `الليث اللامع` | 1667 | 2 | 4 |
| `laithCars` | `الليث لتجارة السيارات` | 3255 | 2 | 4 |

## Duplicate Chassis Details

### `baraka`

#### Duplicate Group 1

- sourceId: `baraka`
- sourceName: `البركة`
- total records in source: 65
- chassis: `HJ4ABBHK5SN070682`
- duplicateCount: 2
- rowIndexes: 44, 46

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 44 | 220 | ROX0002 | ROX 01 VIP 6-Seats REV - 2025 GCC | ROX | Not-Available | - | - | - | Ready for Sale | - | - | - | 2025-11-30T00:00:00 | - | - | - | - | - | -No Sales Employee / Buyer- |
| 46 | 222 | ROX0001 | ROX 01 7-Seats REV - 2025 GCC | ROX | Not-Available | - | - | - | Ready for Sale | - | - | - | 2025-11-30T00:00:00 | - | - | - | - | - | -No Sales Employee / Buyer- |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: no.
- Different document numbers: no.
- Different dates: no.
- Differing fields observed: AbsEntry.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

### `dania`

#### Duplicate Group 1

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF8PZ437753`
- duplicateCount: 2
- rowIndexes: 50, 115

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 50 | 51 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 115 | 116 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100015 | 2025100002 | 2025100001 | - | - | عليان ابو حمور |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 2

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ437950`
- duplicateCount: 2
- rowIndexes: 51, 116

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 52 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 116 | 117 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100006 | 2025100002 | 2025100001 | - | 2025-04-30T00:00:00 | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 3

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF1PZ437951`
- duplicateCount: 2
- rowIndexes: 52, 117

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 52 | 53 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 117 | 118 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-22T00:00:00 | 2025100181 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 4

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF3PZ437952`
- duplicateCount: 2
- rowIndexes: 53, 118

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 53 | 54 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 118 | 119 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100011 | 2025100002 | 2025100001 | - | - | عبد الرحيم يامين |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 5

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ437953`
- duplicateCount: 2
- rowIndexes: 54, 119

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 54 | 55 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 119 | 120 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-09-13T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-09-18T00:00:00 | 2025100951 | 2025100002 | 2025100001 | 2025-09-13T00:00:00 | 2025-09-18T00:00:00 | Zaid AL Obaidi - distributors |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 6

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ437957`
- duplicateCount: 2
- rowIndexes: 55, 120

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 55 | 56 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 120 | 121 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 7

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF6PZ437962`
- duplicateCount: 2
- rowIndexes: 56, 121

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 56 | 57 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 121 | 122 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-18T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-02T00:00:00 | 2025100090 | 2025100002 | 2025100001 | 2025-03-01T00:00:00 | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 8

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ437967`
- duplicateCount: 2
- rowIndexes: 57, 122

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 57 | 58 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 122 | 123 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-18T00:00:00 | 2025100035 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 9

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ437969`
- duplicateCount: 2
- rowIndexes: 58, 123

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 58 | 59 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 123 | 124 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100028 | 2025100002 | 2025100001 | - | - | أحمد الحراحشة |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 10

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ437970`
- duplicateCount: 2
- rowIndexes: 59, 124

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 59 | 60 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 124 | 125 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100059 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 11

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF6PZ437976`
- duplicateCount: 2
- rowIndexes: 60, 125

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 60 | 61 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 125 | 126 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100014 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 12

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF3PZ437997`
- duplicateCount: 2
- rowIndexes: 61, 126

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 62 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 126 | 127 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100014 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 13

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ437999`
- duplicateCount: 2
- rowIndexes: 62, 127

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 62 | 63 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 127 | 128 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-16T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100010 | 2025100002 | 2025100001 | - | - | حمود الخلايله |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 14

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ441289`
- duplicateCount: 2
- rowIndexes: 63, 128

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 63 | 64 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 128 | 129 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 15

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ441291`
- duplicateCount: 2
- rowIndexes: 64, 129

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 64 | 65 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 129 | 130 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-11T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100024 | 2025100002 | 2025100001 | - | - | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 16

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ441295`
- duplicateCount: 2
- rowIndexes: 65, 130

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 65 | 66 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 130 | 131 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-11T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100023 | 2025100002 | 2025100001 | - | - | عز الدين البسطامي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 17

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ441296`
- duplicateCount: 2
- rowIndexes: 66, 131

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 66 | 67 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 131 | 132 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100029 | 2025100002 | 2025100001 | 2025-02-20T00:00:00 | 2025-04-16T00:00:00 | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 18

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ441299`
- duplicateCount: 2
- rowIndexes: 67, 132

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 67 | 68 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 132 | 133 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-18T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-02T00:00:00 | 2025100090 | 2025100002 | 2025100001 | 2025-03-01T00:00:00 | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 19

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ441300`
- duplicateCount: 2
- rowIndexes: 68, 133

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 68 | 69 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 133 | 134 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100058 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 20

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF8PZ441303`
- duplicateCount: 2
- rowIndexes: 69, 134

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 69 | 70 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 134 | 135 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-23T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100060 | 2025100002 | 2025100001 | 2025-02-23T00:00:00 | 2025-02-26T00:00:00 | أحمد الحراحشة |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 21

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ441304`
- duplicateCount: 2
- rowIndexes: 70, 135

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 70 | 71 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 135 | 136 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-18T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-02T00:00:00 | 2025100090 | 2025100002 | 2025100001 | 2025-03-01T00:00:00 | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 22

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ441308`
- duplicateCount: 2
- rowIndexes: 71, 136

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 72 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 136 | 137 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100014 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 23

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ441311`
- duplicateCount: 2
- rowIndexes: 72, 137

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 72 | 73 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 137 | 138 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100025 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 24

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ441313`
- duplicateCount: 2
- rowIndexes: 73, 138

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 73 | 74 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 138 | 139 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-09T00:00:00 | 2025100117 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 25

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ441315`
- duplicateCount: 2
- rowIndexes: 74, 139

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 74 | 75 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 139 | 140 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-27T00:00:00 | 2025100074 | 2025100002 | 2025100001 | 2025-02-19T00:00:00 | - | هاشم سعيد |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 26

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF6PZ441316`
- duplicateCount: 2
- rowIndexes: 75, 140

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 75 | 76 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 140 | 141 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100058 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 27

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF8PZ441317`
- duplicateCount: 2
- rowIndexes: 76, 141

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 76 | 77 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 141 | 142 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100014 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 28

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ449784`
- duplicateCount: 2
- rowIndexes: 77, 96

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 77 | 78 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 96 | 97 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-23T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-24T00:00:00 | 2025100054 | 2025100002 | 2025100001 | 2025-02-23T00:00:00 | 2025-02-24T00:00:00 | أحمد الحراحشة |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 29

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF8PZ449899`
- duplicateCount: 2
- rowIndexes: 78, 97

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 78 | 79 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 97 | 98 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100025 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 30

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ449749`
- duplicateCount: 2
- rowIndexes: 79, 98

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 79 | 80 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 98 | 99 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-23T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-23T00:00:00 | 2025100046 | 2025100002 | 2025100001 | 2025-02-23T00:00:00 | - | ريم الراوي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 31

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ449752`
- duplicateCount: 2
- rowIndexes: 80, 99

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 80 | 81 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 99 | 100 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100019 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 32

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ449753`
- duplicateCount: 2
- rowIndexes: 81, 100

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 82 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 100 | 101 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-22T00:00:00 | 2025100044 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 33

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ449760`
- duplicateCount: 2
- rowIndexes: 82, 101

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 82 | 83 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 101 | 102 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-27T00:00:00 | 2025100068 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 34

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ441165`
- duplicateCount: 2
- rowIndexes: 83, 102

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 83 | 84 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 102 | 103 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100003 | 2025100002 | 2025100001 | - | - | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 35

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ445815`
- duplicateCount: 2
- rowIndexes: 84, 103

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 84 | 85 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 103 | 104 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-24T00:00:00 | 2025100050 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 36

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF3PZ445825`
- duplicateCount: 2
- rowIndexes: 85, 104

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 85 | 86 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 104 | 105 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100008 | 2025100002 | 2025100001 | - | 2025-04-30T00:00:00 | لسن الزعبي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 37

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ445827`
- duplicateCount: 2
- rowIndexes: 86, 105

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 86 | 87 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 105 | 106 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-11T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100017 | 2025100002 | 2025100001 | - | - | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 38

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF1PZ449761`
- duplicateCount: 2
- rowIndexes: 87, 106

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 87 | 88 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 106 | 107 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-16T00:00:00 | 2025100014 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 39

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ445845`
- duplicateCount: 2
- rowIndexes: 88, 107

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 88 | 89 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 107 | 108 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100059 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 40

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF3PZ449728`
- duplicateCount: 2
- rowIndexes: 89, 108

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 89 | 90 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 108 | 109 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100004 | 2025100002 | 2025100001 | - | - | آيه العجوري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 41

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF1PZ449730`
- duplicateCount: 2
- rowIndexes: 90, 109

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 90 | 91 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 109 | 110 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100005 | 2025100002 | 2025100001 | - | - | زيد العبيدي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 42

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ449734`
- duplicateCount: 2
- rowIndexes: 91, 110

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 92 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 110 | 111 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 43

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ449735`
- duplicateCount: 2
- rowIndexes: 92, 111

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 92 | 93 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 111 | 112 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-11T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100002 | 2025100002 | 2025100001 | - | - | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 44

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ449736`
- duplicateCount: 2
- rowIndexes: 93, 112

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 93 | 94 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 112 | 113 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-12T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-12T00:00:00 | 2025100009 | 2025100002 | 2025100001 | - | - | عليان ابو حمور |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 45

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ445938`
- duplicateCount: 2
- rowIndexes: 94, 113

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 94 | 95 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 113 | 114 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-26T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-02-26T00:00:00 | 2025100065 | 2025100002 | 2025100001 | 2025-02-26T00:00:00 | 2025-02-26T00:00:00 | عبد الرحيم يامين |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 46

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ445944`
- duplicateCount: 2
- rowIndexes: 95, 114

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 95 | 96 | FOR00003 | S60EV Series - Standard type | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 114 | 115 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-18T00:00:00 | 2025-02-10T00:00:00 | 2025-01-01T00:00:00 | 2025-03-02T00:00:00 | 2025100090 | 2025100002 | 2025100001 | 2025-03-01T00:00:00 | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 47

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF2PZ437750`
- duplicateCount: 2
- rowIndexes: 142, 178

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 142 | 143 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 178 | 179 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-26T00:00:00 | 2025100066 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 48

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF1PZ437819`
- duplicateCount: 2
- rowIndexes: 143, 179

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 143 | 144 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 179 | 180 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-22T00:00:00 | 2025100044 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 49

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ437961`
- duplicateCount: 2
- rowIndexes: 144, 180

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 144 | 145 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 180 | 181 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 50

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ437971`
- duplicateCount: 2
- rowIndexes: 145, 181

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 145 | 146 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 181 | 182 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-22T00:00:00 | 2025100044 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 51

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF6PZ437993`
- duplicateCount: 2
- rowIndexes: 146, 182

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 146 | 147 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 182 | 183 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-24T00:00:00 | 2025100051 | 2025100002 | 2025100001 | - | 2025-02-24T00:00:00 | آيه العجوري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 52

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ437998`
- duplicateCount: 2
- rowIndexes: 147, 183

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 147 | 148 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 183 | 184 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 53

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ441285`
- duplicateCount: 2
- rowIndexes: 148, 184

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 148 | 149 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 184 | 185 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-03-22T00:00:00 | 2025100182 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 54

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ441301`
- duplicateCount: 2
- rowIndexes: 149, 185

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 149 | 150 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 185 | 186 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100025 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 55

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF1PZ441305`
- duplicateCount: 2
- rowIndexes: 150, 186

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 150 | 151 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 186 | 187 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100058 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 56

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ441309`
- duplicateCount: 2
- rowIndexes: 151, 187

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 151 | 152 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 187 | 188 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-03-11T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-03-12T00:00:00 | 2025100138 | 2025100002 | 2025100001 | 2025-03-11T00:00:00 | 2025-03-13T00:00:00 | لسن الزعبي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 57

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ441312`
- duplicateCount: 2
- rowIndexes: 152, 188

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 152 | 153 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 188 | 189 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-03-04T00:00:00 | 2025100104 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 58

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ441318`
- duplicateCount: 2
- rowIndexes: 153, 189

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 153 | 154 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 189 | 190 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100058 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 59

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ449751`
- duplicateCount: 2
- rowIndexes: 154, 166

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 154 | 155 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 166 | 167 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-03-13T00:00:00 | 2025100143 | 2025100002 | 2025100001 | - | 2025-02-27T00:00:00 | حمود الخلايله |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 60

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ449754`
- duplicateCount: 2
- rowIndexes: 155, 167

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 155 | 156 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 167 | 168 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100059 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 61

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF8PZ449756`
- duplicateCount: 2
- rowIndexes: 156, 168

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 156 | 157 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 168 | 169 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 62

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BFXPZ445823`
- duplicateCount: 2
- rowIndexes: 157, 169

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 157 | 158 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 169 | 170 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100058 | 2025100002 | 2025100001 | - | - | اركان العمري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 63

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ445826`
- duplicateCount: 2
- rowIndexes: 158, 170

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 158 | 159 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 170 | 171 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-27T00:00:00 | 2025100068 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 64

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF0PZ445829`
- duplicateCount: 2
- rowIndexes: 159, 171

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 159 | 160 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 171 | 172 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-22T00:00:00 | 2025100044 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 65

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF3PZ449759`
- duplicateCount: 2
- rowIndexes: 160, 172

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 160 | 161 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 172 | 173 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-03-03T00:00:00 | 2025100098 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 66

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF9PZ449801`
- duplicateCount: 2
- rowIndexes: 161, 173

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 161 | 162 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 173 | 174 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-25T00:00:00 | 2025100059 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 67

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF4PZ449883`
- duplicateCount: 2
- rowIndexes: 162, 174

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 162 | 163 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 174 | 175 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-11-08T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-11-08T00:00:00 | 2025101251 | 2025100002 | 2025100001 | 2025-11-08T00:00:00 | 2025-11-08T00:00:00 | -No Sales Employee / Buyer- |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 68

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF7PZ445844`
- duplicateCount: 2
- rowIndexes: 163, 175

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 163 | 164 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 175 | 176 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | - | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-17T00:00:00 | 2025100020 | 2025100002 | 2025100001 | - | - | شركة الليث لتجارة السيارات |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 69

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF6PZ445849`
- duplicateCount: 2
- rowIndexes: 164, 176

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 164 | 165 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 176 | 177 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-20T00:00:00 | 2025100043 | 2025100002 | 2025100001 | 2025-02-19T00:00:00 | 2025-02-19T00:00:00 | لسن الزعبي |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 70

- sourceId: `dania`
- sourceName: `دانية الضلال`
- total records in source: 2068
- chassis: `LMXD14BF5PZ449732`
- duplicateCount: 2
- rowIndexes: 165, 177

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 165 | 166 | FOR00002 | T5EV Friday Exclusive-630Km | FOR | Not-Available | - | FreeZone | - | Ready for Sale | - | - | - | - | - | - | - | - | - | - |
| 177 | 178 | FOR00001 | T5EV Friday Exclusive-410Km | FOR | Sold | - | FreeZone | - | Ready for Sale | 2025-02-17T00:00:00 | 2025-02-11T00:00:00 | 2025-01-01T00:00:00 | 2025-02-23T00:00:00 | 2025100047 | 2025100002 | 2025100001 | - | - | آيه العجوري |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

### `laith`

#### Duplicate Group 1

- sourceId: `laith`
- sourceName: `الليث اللامع`
- total records in source: 1667
- chassis: `HJ4ABBHK8SN052872`
- duplicateCount: 2
- rowIndexes: 67, 100

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 67 | 148 | ROX00001 | Rox 01 6seat VIP | ROX | Not-Available | - | Riyadh | - | Not Ready for Sale | - | 2025-02-06T00:00:00 | 2025-01-01T00:00:00 | 2025-03-27T00:00:00 | - | 2025100002 | 2025100001 | - | - | -No Sales Employee / Buyer- |
| 100 | 181 | ROX00002 | Rox 01 7seat | ROX | Sold | - | Riyadh | - | Ready for Sale | 2025-07-23T00:00:00 | 2025-02-06T00:00:00 | 2025-01-01T00:00:00 | 2025-07-21T00:00:00 | 2025100174 | 2025100002 | 2025100001 | 2025-07-27T00:00:00 | 2025-07-28T00:00:00 | MUSAAD ALI AL SHEHRI |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, CreateDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 2

- sourceId: `laith`
- sourceName: `الليث اللامع`
- total records in source: 1667
- chassis: `HJ4ABBHK3TN086915`
- duplicateCount: 2
- rowIndexes: 1165, 1666

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1165 | 1281 | ROX00004 | ROX ADAMAS 7seat | ROX | Sold | - | Riyadh | - | Ready for Sale | 2025-12-01T00:00:00 | 2025-10-22T00:00:00 | 2025-10-20T00:00:00 | 2025-12-02T00:00:00 | 2025100423 | 2025100787 | 2025100022 | 2025-12-01T00:00:00 | 2025-12-02T00:00:00 | MUSAAD ALI AL SHEHRI |
| 1666 | 4022 | ROX00013 | ROX ADAMAS 7seat_Used | ROX | Error | JEDDAH - AUTO MALL | - | 1 | Ready for Sale | - | - | - | - | - | - | - | - | - | - |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AR invoice number, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate, A/RInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

### `laithCars`

#### Duplicate Group 1

- sourceId: `laithCars`
- sourceName: `الليث لتجارة السيارات`
- total records in source: 3255
- chassis: `LDP43A966SS071663`
- duplicateCount: 2
- rowIndexes: 950, 3157

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 950 | 2605 | DFM0007 | Dongfeng Box EV 430 KM - E3 2025 EU | DFM | Reserve | Free Zone -Vehicles- Main | FreeZone | 1 | Ready for Sale | 2026-05-06T00:00:00 | - | - | - | - | - | - | 2026-05-06T00:00:00 | - | معرض سيفو |
| 3157 | 5386 | DFM0031 | Dongfeng Mage Plug-in Hybrid - E1 2026 GCC | DFM | Error | - | - | - | Ready for Sale | - | 2026-04-19T00:00:00 | 2026-04-19T00:00:00 | - | - | 2026201152 | 2026100546 | - | - | - |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: yes.
- Different status values: yes.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AbsEntry, status, AP invoice number, PO number, CreateDate, GRPO_Date, APInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

#### Duplicate Group 2

- sourceId: `laithCars`
- sourceName: `الليث لتجارة السيارات`
- total records in source: 3255
- chassis: `LDP45G903TG508323`
- duplicateCount: 2
- rowIndexes: 3093, 3094

| rowIndex | AbsEntry | ItemCode | Model | U_Brand | Chassis_Status | WhsName | BPLName | Quantity | Ready | CreateDate | GRPO_Date | APInvDate | A/RInvDate | ARInvNo | APInvNo | PONo | ReserveDate | ContractDate | SalesMan |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3093 | 5323 | DFM0031 | Dongfeng Mage Plug-in Hybrid - E1 2026 GCC | DFM | Cession | Amman-Spare Parts-Main | Amman | 1 | Ready for Sale | 2026-05-02T00:00:00 | 2026-03-31T00:00:00 | 2026-03-25T00:00:00 | - | 2026101266 | 2026101405 | 2026200009 | 2026-05-05T00:00:00 | 2026-05-05T00:00:00 | محمد سالم الخطاب |
| 3094 | 5323 | DFM0031 | Dongfeng Mage Plug-in Hybrid - E1 2026 GCC | DFM | Cession | Amman-Spare Parts-Main | Amman | 1 | Ready for Sale | 2026-05-02T00:00:00 | 2026-04-11T00:00:00 | 2026-04-11T00:00:00 | - | 2026101266 | 2026201159 | 2026100554 | 2026-05-05T00:00:00 | 2026-05-05T00:00:00 | محمد سالم الخطاب |

**Analysis**

- Rows identical: no.
- Different AbsEntry values: no.
- Different status values: no.
- Different document numbers: yes.
- Different dates: yes.
- Differing fields observed: AP invoice number, PO number, GRPO_Date, APInvDate.
- Assessment: Reason unclear; requires SAP/CounterScreen owner confirmation.

## Conclusion

Duplicates were found within the same source/API response. These are not only duplicates across different companies or sources.

`sourceId + chassis` is unsafe as a unique key for current inventory upserts.

## Database Impact

- `sourceId + chassis` cannot be used as a unique key.
- Chassis-based upsert can collapse duplicate rows.
- Collapsing rows can affect stock count, VIN report, sales status, reservation status, and dashboard totals.

## Questions For Responsible Team

- Should a chassis appear more than once in the same CounterScreen source?
- If yes, what do the duplicate rows represent?
- If no, which system should clean or prevent them?
- What is the official unique identifier for a CounterScreen row?
- Is `AbsEntry` supposed to be unique per source?
- Should the dashboard count all duplicate chassis rows or only one row per chassis?

## Recommended Temporary Handling

- Preserve every row returned by the API.
- Do not collapse by chassis.
- Do not use chassis as the database unique key.
- Use a technical row key for reporting sync until the official business key is confirmed.

## Appendix

- Command used: `COUNTERSCREEN_REJECT_UNAUTHORIZED=false npm run inspect:duplicate-chassis -- --show-full-chassis --output docs/counterscreen-duplicate-chassis-investigation-report.md`
- Script path: `backend/scripts/report-duplicate-chassis.ts`
- Generated timestamp: `2026-05-07T10:52:55.723Z`
- Source endpoints:
  - `baraka`: `https://laithobaidi.b1pro.com:8099/CounterScreen?filter=All`
  - `dania`: `https://laithobaidi.b1pro.com:8091/CounterScreen?filter=All`
  - `laith`: `https://laithobaidi.b1pro.com:8090/CounterScreen?filter=All`
  - `laithCars`: `https://laithobaidi.b1pro.com:8599/CounterScreen?filter=All`

## Business Clarification Applied

The duplicate chassis behavior is now treated as valid row-level business state in reporting sync. Rows are preserved even when chassis repeats in the same source, and sync no longer relies on chassis uniqueness.
