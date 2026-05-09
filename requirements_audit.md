# Inventory / Stock Management Dashboard — Requirements Audit

Below is a read-only audit of the current project. Existing frontend/backend code was inspected only.

## Requirements Checklist

| # | Requirement | Status | Evidence | Missing parts / notes | Priority |
|---:|---|---|---|---|---|
| 1 | Inventory Movement: slow >90, medium 30-90, fast <30 | Done | `backend/src/integrations/counterscreen/counterscreen.mapper.ts`, `getMovementCategory()` | Exact thresholds exist: `> 90`, `>= 30`, else fast | High |
| 2 | Inventory Movement: view by Units and VIN/chassis | Done | `frontend/src/app/inventory-movement/page.tsx`, columns `chassis`, `qty` | Present in table | High |
| 3 | Inventory Movement: breakdown by brand/agency, model, type/category, color, warehouse | Partial | Filters in `FilterBar.tsx`; data fields in `InventoryItem`; some reports group by brand/model/color | No single full breakdown report by all requested dimensions, agency/source not consistently shown as “agency” | Medium |
| 4 | Inventory Movement: KPI Days in Stock per item | Done | `stockAgeDays` from mapper; displayed in `inventory-movement/page.tsx` | Present as table column | High |
| 5 | Auto Alerts: slow stock 90+ days | Done | `backend/src/inventory/inventory.service.ts:getAlerts`; frontend `alerts/page.tsx` | Dashboard/alerts table shows slow stock alerts | High |
| 6 | Auto Alerts: low quantity / below min stock | Not Done | No min stock alert logic found | No min quantity fields/config | High |
| 7 | Auto Alerts: below reorder point | Not Done | Reorder point exists in replenishment, but alerts do not use it | No alert generated for below reorder point | High |
| 8 | Auto Alerts: dashboard delivery | Done | `dashboard.service.ts`, `recentAlerts`; `dashboard/page.tsx` | Dashboard displays recent alerts | High |
| 9 | Auto Alerts: email delivery | Not Done | Settings text mentions future exports/alerts only | No email service/job found | Medium |
| 10 | Auto Alerts: WhatsApp optional | Not Done | Translation/settings mention future WhatsApp workflow | No WhatsApp integration found | Medium |
| 11 | Auto Alerts: configurable thresholds per model/warehouse | Not Done | No threshold config model/store found | Thresholds are hardcoded or derived | High |
| 12 | Replenishment: Min / Max / Reorder Point per model/color | Partial | `getReplenishment()`, `calculateReplenishment()` compute `reorderPoint` by model/color | No min/max config per model/color | High |
| 13 | Replenishment: auto suggested order quantity | Done | `suggestedOrderQuantity` in backend/frontend reports | Derived from reorder point minus stock | High |
| 14 | Replenishment: relation with Carflow/sales consumption | Partial | Uses sold last 90 days from inventory sales data | No direct Carflow integration found | High |
| 15 | Replenishment: lead time per supplier/factory | Not Done | No lead time fields/calculation found | Missing supplier/factory lead time model | Medium |
| 16 | Stock Coverage: months current stock covers per model | Done | `getStockCoverage()`, `calculateStockCoverage()` | Uses current stock / average monthly sales | High |
| 17 | Stock Coverage: target coverage 3 months configurable | Not Done | No configurable target found | Logic uses danger `<1`, overstock `>4`; no target setting | Medium |
| 18 | Stock Coverage: alerts less than 1 danger, more than 4 overstock | Partial | `status: danger/overstock` in stock coverage | Status exists, but not delivered as alert notification | High |
| 19 | Sales Performance: best-selling / lowest-selling | Done | `getSalesPerformance()`, `topSellingModels`, `lowestSellingModels` | Present in backend/frontend types | High |
| 20 | Sales Performance: average movement | Partial | Inventory movement has movement categories; sales has average monthly sales elsewhere | No explicit average movement KPI in sales performance | Medium |
| 21 | Sales Performance: breakdown by model, type/category, color, branch, country | Partial | Backend groups by model, branch, source/country; filters include type/color | Missing explicit type/category and color breakdown in sales performance output | Medium |
| 22 | Sales Performance: sell-through rate | Not Done | No sell-through calculation found | Missing KPI | High |
| 23 | Sales Performance: inventory turnover | Not Done | No turnover calculation found | Missing KPI | High |
| 24 | Aggregated Stock: unit-only by type + color without VIN | Partial | `getAggregatedStock()` groups by brand/model/color | Does not group by type + color specifically | Medium |
| 25 | Aggregated Stock: detailed VIN/chassis report | Done | Backend `GET /aggregated-stock/vins`; `ReportsService.getVinReport()` | Endpoint returns inventory rows including chassis | Medium |
| 26 | Aggregated Stock: daily snapshot | Not Done | No snapshot persistence/scheduler found | Missing historical storage | Medium |
| 27 | Aggregated Stock: monthly comparison | Not Done | No monthly comparison logic found | Missing historical data | Medium |
| 28 | Logistics: statuses In Transit, At Port, Customs, Warehouse | Partial | `getLogisticsStatus()` returns `In Transit`, `Warehouse`, `Sold`, `Unknown` | Missing `At Port`, `Customs` | Medium |
| 29 | Logistics: cycle time Order → Arrival | Not Done | No cycle-time calculation found | Dates exist, but no calculation | Medium |
| 30 | Logistics: supplier delays | Not Done | No supplier delay logic found | Missing supplier baseline/ETA variance logic | Medium |
| 31 | Logistics: shipping cost per car optional | Not Done | No shipping cost field/calculation found | Missing | Low |
| 32 | Multi-Location: stock by warehouse/city/country | Partial | `getMultiLocation()` groups by source/branch/warehouse/brand/model/color; frontend page exists | Country/warehouse present; city not explicit | High |
| 33 | Multi-Location: transfer tracking between warehouses | Not Done | No transfer entity/status found | Missing | Medium |
| 34 | Multi-Location: stock rebalancing recommendations | Not Done | No rebalance recommendation logic found | Missing | Medium |
| 35 | Daily Dashboard: total stock units | Done | `DashboardService.getSummary()`, `dashboard/page.tsx` metrics | Present | High |
| 36 | Daily Dashboard: slow / medium / fast | Done | Dashboard metrics and summary calculations | Present | High |
| 37 | Daily Dashboard: stock coverage months | Done | `stockCoverageMonths` in dashboard metrics | Present | High |
| 38 | Daily Dashboard: top/bottom models | Partial | Dashboard shows top selling; sales performance has lowest selling | Dashboard itself does not show bottom models | Medium |
| 39 | Daily Dashboard: live refresh | Done | `Topbar.refreshData()`, `InventoryDataProvider.refreshData()` | Manual live refresh present | High |
| 40 | Daily Dashboard: Excel/PDF export | Not Done | Settings translation says exports are future modules | No export implementation found | Medium |
| 41 | General: reports run automatically daily | Not Done | No scheduler/cron found | Missing backend scheduled reports | High |
| 42 | General: filters by Brand, Model, Color, Branch | Done | `FilterBar.tsx`, `filterInventory.ts`, backend `InventoryQueryDto` | Present frontend and partial backend query DTO | High |
| 43 | General: user permissions | Not Done | `settings/page.tsx` says authentication deferred | No auth/roles/permissions implemented | High |
| 44 | General: direct SAP + Carflow integration | Partial | CounterScreen/SAP-like source integration in `CounterScreenService` | No Carflow integration found | High |
| 45 | General: easy UI | Partial | Existing dashboard, sidebar, filters, tables | Subjective; UI exists but no formal UX validation | Low |
| 46 | General: fast extraction/performance | Partial | Backend cache TTL in `CounterScreenService`; frontend cache/filter optimizations | No load testing or server-side performance guarantees found | High |

## Extra Features Found

| Feature | Status | Evidence |
|---|---|---|
| English/Arabic support | Done | `I18nProvider.tsx`, `translations.ts`, `LanguageToggle` |
| RTL/LTR | Done | `document.documentElement.dir`, `body.dir` in `I18nProvider.tsx` |
| Light/dark theme | Done | `ThemeProvider`, `ThemeToggle`, CSS theme tokens |
| Frontend caching | Done | `InventoryDataProvider`, cached inventory data in state |
| Backend CounterScreen cache | Done | `CounterScreenService.cache`, TTL env |
| Manual refresh | Done | `Topbar`, `refreshData()` |
| Global filters | Done | `FilterProvider`, `useGlobalFilters` |
| Client-side live filtering | Done | `filterInventory.ts`, `InventoryDataProvider.getFilteredData()` |
| Static official statuses | Done | `constants/statuses.ts` |
| Salesmen KPI page | Done | `frontend/src/app/salesmen-kpi/page.tsx` |
| Currency conversion/display | Done | `currency.ts`, `exchangeRates.ts`, `CurrencySelector` |
| Table column search | Done | `DataTable.tsx` |
| Table internal scroll/pagination | Done | `DataTable.module.css`, `DataTable.tsx` |
| Loading screens / disabled buttons while loading | Done | `LoadingScreen`, `ApiState`, `useAppBusy` |

## Overall Completion Estimate

Approximately **52% complete** against the full requirements list.

## Done Summary

Core inventory movement, stock age classification, dashboard KPIs, manual refresh, stock coverage calculation, suggested replenishment quantity, slow-stock dashboard alerts, global filters, multilingual UI, themes, currency display, and table usability features are implemented.

## Partial Summary

Replenishment, sales performance breakdowns, aggregated stock, logistics, multi-location, SAP-like integration, and performance are present but not complete against the requested business requirements.

## Not Done Summary

Major missing areas are configurable thresholds, min/max stock rules, email/WhatsApp alert delivery, scheduled daily reports, user permissions, Carflow integration, historical snapshots/monthly comparison, sell-through, inventory turnover, transfer tracking, stock rebalancing, logistics cycle time/delays, and Excel/PDF export.

## Top 10 Missing Items By Priority

1. User permissions/auth/roles.
2. Configurable alert thresholds per model/warehouse.
3. Low quantity / below min stock alerts.
4. Below reorder point alerts.
5. Direct Carflow integration.
6. Scheduled daily report generation.
7. Sell-through rate KPI.
8. Inventory turnover KPI.
9. Historical daily snapshots and monthly comparison.
10. Email/WhatsApp alert delivery.

## Audit Note

No code was changed during this audit.
