# Frontend Data Health Report

## Problems Found

- The inventory provider used one `loadData(refresh)` boolean for multiple refresh reasons. A WebSocket `inventory.updated` event called `loadData(true)`, which sent `refresh=true` to `GET /api/inventory`. In the backend, that query parameter triggers another inventory sync, so a WebSocket notification could cause another sync instead of only refetching reporting data.
- The dashboard fetched `/api/dashboard/summary` directly while also calculating dashboard data from the shared provider. That created a second request path with separate timing and fallback behavior.
- The provider had no in-flight request guard. Closely spaced manual refreshes, visibility changes, or WebSocket events could overlap and let stale responses overwrite newer state.
- Supporting requests such as stock rules could fall back to empty arrays during refresh, which could make derived dashboard values temporarily change even when inventory data was still valid.
- Tables used row indexes as React keys by default. For inventory rows, that is less stable than `inventoryKey` and is not appropriate for duplicate chassis rows.

## New State Model

The shared inventory provider now tracks:

- `inventoryItems`: last successful inventory rows.
- `sources`: last successful source list.
- `meta`: last successful inventory metadata.
- `hasSuccessfulData`: whether at least one inventory fetch succeeded.
- `isInitialLoading`: true only when there is no successful data yet.
- `isRefreshing`: true for background refreshes while keeping old data visible.
- `error`: latest inventory or supporting request error.
- `lastRefreshStartedAt`: timestamp for the latest refresh attempt.
- `lastRefreshFailedAt`: timestamp for the latest failed refresh.
- `liveStatus`: Socket.IO connection and latest `inventory.updated` event state.
- `isSocketConnected` and `syncStatus`: convenience state for UI indicators.

## Refresh Behavior

- Initial load now starts immediately when the provider mounts and calls normal
  reporting REST endpoints without `refresh=true`.
- Initial load shows the loading screen until the first successful inventory response.
- Background refreshes keep the previous successful inventory rows, metadata, sources, and stock rules visible.
- Successful refreshes replace the old data atomically.
- Failed refreshes keep old data and show a non-blocking error banner.
- A successful empty backend response is still treated as a real empty result; old data is not preserved over a valid empty response.
- In-flight refreshes are deduplicated so a second identical refresh request does not start while one is already running.
- Response versioning prevents older responses from overwriting newer provider state.

## WebSocket Behavior

- Socket.IO still connects to the `/inventory` namespace and listens for `inventory.updated`.
- WebSocket events are debounced before triggering a REST refetch.
- WebSocket-triggered refreshes no longer send `refresh=true`; they only refetch current database-backed REST data.
- The frontend does not receive inventory datasets over WebSocket.

## Manual Refresh Behavior

- Manual refresh remains available from the topbar.
- Manual refresh is the only frontend path that sends `refresh=true` to `GET /api/inventory`, preserving the existing backend-triggered sync behavior.
- The dashboard remains visible during manual refresh, and only the refresh UI indicates progress.

## Initial Load Behavior

- The provider calls `refreshInventoryData({ reason: "initial-load", triggerSync: false })` on mount.
- Initial load fetches `GET /api/inventory`, `GET /api/sources`, and `GET /api/stock-rules`.
- Initial load does not trigger backend inventory sync.

## Files Changed

- `frontend/src/providers/InventoryDataProvider/InventoryDataProvider.tsx`
- `frontend/src/hooks/useInventorySocket.ts`
- `frontend/src/services/inventoryApi.ts`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/Topbar/Topbar.tsx`
- `frontend/src/components/DataTable/DataTable.tsx`
- `frontend/src/types/inventory.ts`
- `docs/frontend-data-health-report.md`

## Manual Testing Notes

- `npm run lint` passed.
- `npm run build` passed.
- The provider no longer clears rows before refresh.
- The dashboard no longer performs an independent `/api/dashboard/summary` fetch.
- Socket-triggered refreshes are debounced and no longer trigger backend sync loops.

## Remaining Risks

- Some configuration pages still perform direct local fetching, but they are not part of the inventory reporting dashboard lifecycle.
- The project does not use TanStack Query. The current manual provider now covers stale-while-revalidate, request deduplication, and stale response protection for inventory reporting without adding a new dependency.
- Browser Network-tab verification is still useful to confirm there is no request storm in the user's local dev browser session.
