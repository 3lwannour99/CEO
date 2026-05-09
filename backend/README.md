# CEOReport Backend

NestJS API for CEOReport.

## Data Flow

CounterScreen/SAP is the operational source of truth. PostgreSQL is the reporting source of truth.

```txt
CounterScreen/SAP
-> inventory sync job
-> PostgreSQL reporting tables
-> API endpoints
-> frontend dashboard
```

Normal dashboard APIs read from PostgreSQL. CounterScreen is called only by backend sync logic, inspection scripts, or a manual `refresh=true` request.

`InventoryItem` is the reporting source of truth. Raw CounterScreen payloads are not persisted; sync counts remain available through `InventorySyncRun.totalRawRecords` and `InventorySourceSyncResult.recordsCount`. `GET /api/inventory/raw` is a disabled compatibility endpoint that returns an empty data array and an explanatory message.

## Environment

For Docker Compose, use the root environment file:

```bash
cp .env.example .env
```

Edit `.env` locally before starting containers. Docker Compose automatically reads the root `.env` for `${VAR}` interpolation, and each service also uses `env_file: .env` so runtime variables are passed into the containers.

Real `.env` files must not be committed. The committed `.env.example` files contain placeholders only.

Root Docker Compose uses service-prefixed names where useful:

- `HOST_UID` and `HOST_GID`: host user and group used by the backend container in development so generated files under bind mounts are not created as root. Set them with `id -u` and `id -g`.
- `FRONTEND_PORT`: host port for the frontend container.
- `BACKEND_PORT`: host port for the backend container; mapped to `PORT` inside the backend container.
- `POSTGRES_PORT`: host port for PostgreSQL.
- `FRONTEND_WATCHPACK_POLLING`, `FRONTEND_CHOKIDAR_USEPOLLING`, `FRONTEND_CHOKIDAR_INTERVAL`: mapped to frontend tooling variable names.
- `BACKEND_CHOKIDAR_USEPOLLING`, `BACKEND_CHOKIDAR_INTERVAL`, `BACKEND_TSC_WATCHFILE`, `BACKEND_TSC_WATCHDIRECTORY`, `BACKEND_WATCHPACK_POLLING`: mapped to backend tooling variable names.
- `DATABASE_URL`: Prisma schema/database URL used by Prisma CLI commands.
- `TEMPLATE_DB_URL`: PostgreSQL connection string used by the Prisma adapter at runtime.
- `COUNTERSCREEN_TIMEOUT_MS`: timeout for each CounterScreen source request.
- `COUNTERSCREEN_REJECT_UNAUTHORIZED`: set to `false` only when the source TLS setup requires it.
- `INVENTORY_SYNC_ENABLED`: enables or disables scheduled inventory sync.
- `INVENTORY_SYNC_INTERVAL_CRON`: cron expression for scheduled sync.

Use `backend/.env.example` only when running the backend directly outside Docker. Use `frontend/.env.example` only when running the frontend directly outside Docker. Docker Compose should use the root `.env`.

For Docker development on Linux/macOS, set the backend container user in the root `.env`:

```bash
HOST_UID=$(id -u)
HOST_GID=$(id -g)
```

The root `docker-compose.yml` uses `user: "${HOST_UID}:${HOST_GID}"` for the backend service. This keeps Prisma files generated through the `./backend:/app` bind mount owned by your host user instead of root. `backend/src/generated` remains ignored and should not be committed.

## Setup

```bash
npm install
npm run db:sync
npm run start:dev
```

The Prisma client is generated into:

```txt
backend/src/generated/prisma-client
```

Prisma uses folder schema loading from:

```txt
backend/prisma/schema
```

Keep generator and datasource in `schema.prisma`, enums in `enums.prisma`, and each model in its own kebab-case `.prisma` file.

## Prisma Development Policy

During active development, do not commit Prisma migration files. Multiple developers are still changing the schema, so `backend/prisma/schema` is the source of truth until the database schema stabilizes.

Migration history is intentionally disabled/ignored for now:

- Do not generate or commit new files under `backend/prisma/migrations`.
- Do not use committed migration history as the local development sync mechanism.
- Use `prisma db push` to sync local development databases from the Prisma schema.
- Keep migration files ignored until the team decides the schema is stable enough for migrations.

Existing migration files may still be present from earlier work. Leave them alone for now unless the team explicitly decides to reset or formalize migration history.

Use these commands when changing or syncing the schema:

```bash
npx prisma validate
npx prisma format
npx prisma generate
npx prisma db push
```

If the generated Prisma client has stale or permission-conflicted files, remove `backend/src/generated/prisma-client` and rerun `npx prisma generate`.

## Sync Locally

The scheduler runs every minute by default when `INVENTORY_SYNC_ENABLED` is not `false`.

Manual sync:

```bash
curl -X POST http://localhost:4000/api/inventory-sync/run
```

Sync status:

```bash
curl http://localhost:4000/api/inventory-sync/status
```

Recent runs:

```bash
curl http://localhost:4000/api/inventory-sync/runs
```

## Useful Commands

```bash
npm run start:all
npm run db:sync
npm run start:dev
npm run build
npm run test
```

## API Docs

Swagger:

```txt
http://localhost:4000/swagger
```

Architecture docs:

```txt
docs/data-architecture.md
docs/live-apis.md
```
