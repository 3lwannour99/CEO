# CEOReport Backend

NestJS API for CEOReport.

## Data Flow

CounterScreen/SAP is the operational source of truth. The configured local database is the reporting source of truth.

```txt
CounterScreen/SAP
-> inventory sync job
-> database reporting tables
-> API endpoints
-> frontend dashboard
```

Normal dashboard APIs read from the configured reporting database by default. CounterScreen is called by backend sync logic in `database` mode, and can be used as the direct API source in `live` mode.

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
- `NEXT_PUBLIC_API_BASE_URL`: browser REST API base URL.
- `NEXT_PUBLIC_WS_BASE_URL`: browser Socket.IO base URL; the frontend connects to the `/inventory` namespace.
- `FRONTEND_URL`: allowed browser origin for backend CORS and inventory WebSocket connections.
- `DATABASE_PROVIDER`: active local Prisma/runtime provider. Defaults to `postgresql` when missing or empty. Use `mysql` only when explicitly selecting MySQL.
- `COMPOSE_PROFILES`: active Docker database service. Use `postgresql` or `mysql`, and keep it aligned with `DATABASE_PROVIDER`.
- `POSTGRES_PORT`: host port for PostgreSQL.
- `POSTGRES_DATABASE_URL`: PostgreSQL connection string.
- `MYSQL_PORT`: host port for MySQL.
- `MYSQL_DATABASE_URL`: MySQL connection string.
- `FRONTEND_WATCHPACK_POLLING`, `FRONTEND_CHOKIDAR_USEPOLLING`, `FRONTEND_CHOKIDAR_INTERVAL`: mapped to frontend tooling variable names.
- `BACKEND_CHOKIDAR_USEPOLLING`, `BACKEND_CHOKIDAR_INTERVAL`, `BACKEND_TSC_WATCHFILE`, `BACKEND_TSC_WATCHDIRECTORY`, `BACKEND_WATCHPACK_POLLING`: mapped to backend tooling variable names.
- `DATABASE_URL`: active database URL kept for compatibility with Prisma tooling.
- `TEMPLATE_DB_URL`: legacy active database URL fallback.
- `COUNTERSCREEN_TIMEOUT_MS`: timeout for each CounterScreen source request.
- `COUNTERSCREEN_REJECT_UNAUTHORIZED`: set to `false` only when the source TLS setup requires it.
- `INVENTORY_DATA_MODE`: inventory API source mode. Allowed values: `database` or `live`. Defaults to `database`.
- `INVENTORY_SYNC_ENABLED`: enables or disables scheduled inventory sync.
- `INVENTORY_SYNC_INTERVAL_CRON`: cron expression for scheduled sync.
- `JWT_SECRET`: required signing secret for access tokens.
- `JWT_EXPIRES_IN`: token lifetime, for example `1d`.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`: optional seed values for creating the first `SUPER_ADMIN` user.
- `ADMIN_EMAIL`: optional legacy user email metadata for seeded admin.

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

## RBAC And Permission Overrides

Access is based on database permissions, not frontend-only constants:

```txt
User -> UserRole -> Role -> RolePermission -> Permission
User -> UserPermission -> Permission
```

Effective permissions are calculated fresh from the database:

```txt
role permissions + direct user ALLOW permissions - direct user DENY permissions
```

`DENY` wins over role permissions and direct allow permissions. `SUPER_ADMIN` is seeded with all permission catalog rows by default, and direct denies can still remove access. The JWT stores identity only for guard decisions; `PermissionsGuard` reloads effective permissions so role and user permission edits apply immediately.

Permission keys use dotted names such as `dashboard.page.view`, `dashboard.cards.totalInventory.view`, `data.cost.view`, and `actions.syncInventory.execute`. Seed data is idempotent: it upserts permission catalog rows, default roles, role-permission mappings, and the optional admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Role management endpoints live under `/api/roles`, permission catalog listing under `/api/permissions`, and direct user overrides under `/api/users/:id/permissions`. Role permission editing replaces the submitted role permission list. User direct permission editing replaces only direct allow/deny overrides and leaves role permissions unchanged.
The Prisma client is generated into:

```txt
backend/src/generated/prisma-client
```

Prisma uses folder schema loading from:

```txt
backend/prisma/schema
```

Keep generator and datasource in `schema.prisma`, enums in `enums.prisma`, and each model in its own kebab-case `.prisma` file.

Prisma datasource providers are fixed when the client is generated. This project supports PostgreSQL and MySQL in development by composing provider-specific generated schema files under `backend/prisma/.generated/`, which is ignored by Git.

Use `DATABASE_PROVIDER` to select the runtime adapter. If it is missing or empty, PostgreSQL is used:

```bash
DATABASE_PROVIDER=postgresql
COMPOSE_PROFILES=postgresql
# or
DATABASE_PROVIDER=mysql
COMPOSE_PROFILES=mysql
```

Generate or push for a specific provider:

```bash
npm run prisma:generate:postgres
npm run prisma:generate:mysql
npm run prisma:push:postgres
npm run prisma:push:mysql
```

Provider-neutral commands use `DATABASE_PROVIDER`:

```bash
npm run prisma:generate
npm run prisma:push
npm run db:sync
```

When switching providers, run the matching generate command before starting the backend so the generated Prisma client provider matches `DATABASE_PROVIDER`.

Render deployments can omit `DATABASE_PROVIDER` while PostgreSQL is the active database, but `DATABASE_URL` must still be defined. MySQL deployments must explicitly set `DATABASE_PROVIDER=mysql` and provide a MySQL `DATABASE_URL` or `MYSQL_DATABASE_URL`.

For temporary low-memory operation on Render:

```bash
INVENTORY_DATA_MODE=live
INVENTORY_SYNC_ENABLED=false
```

This keeps Prisma models and DB-backed reporting code intact, but inventory APIs serve fresh CounterScreen data without writing `InventoryItem` rows.

## Prisma Development Policy

During active development, do not commit Prisma migration files. Multiple developers are still changing the schema, so `backend/prisma/schema` is the source of truth until the database schema stabilizes.

Migration history is intentionally disabled/ignored for now:

- Do not generate or commit new files under `backend/prisma/migrations`.
- Do not use committed migration history as the local development sync mechanism.
- Use `prisma db push` to sync local development databases from the Prisma schema.
- Keep migration files ignored until the team decides the schema is stable enough for migrations.

Existing migration files may still be present from earlier work. Leave them alone for now unless the team explicitly decides to reset or formalize migration history.

Use these commands when changing or syncing the default PostgreSQL schema directly:

```bash
npx prisma validate
npx prisma format
npx prisma generate
npx prisma db push
```

For MySQL, use the provider-specific scripts above. Do not commit files from `backend/prisma/.generated/`.

Prisma generation refreshes `backend/src/generated/prisma-client` in place. On Windows Docker bind mounts, do not delete this directory from inside the Linux container because host-created files may not be removable by the container user. If a manual reset is ever required, stop the backend container, run `npm run clean:generated` from the Windows host, then run `npm run prisma:generate`.

## Sync Locally

The scheduler runs every minute by default when `INVENTORY_SYNC_ENABLED` is not `false` and `INVENTORY_DATA_MODE` is `database`.

If `INVENTORY_DATA_MODE=live`, scheduled sync is skipped and logged:

```txt
Inventory sync disabled because INVENTORY_DATA_MODE=live
```

If `INVENTORY_SYNC_ENABLED=false`, scheduled sync is skipped and logged:

```txt
Inventory sync disabled by INVENTORY_SYNC_ENABLED=false
```

Manual sync:

```bash
curl -H "Authorization: Bearer <token>" -X POST http://localhost:4000/api/inventory-sync/run
```

Sync status:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/inventory-sync/status
```

Recent runs:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/inventory-sync/runs
```

Inventory live updates use Socket.IO as a notification signal only. The backend emits `inventory.updated` on the `/inventory` namespace after an inventory sync run has finished writing database rows and sync logs. The event contains sync metadata, not inventory datasets. The frontend receives the event and refetches the existing REST APIs.

## Authentication And Permissions

CEOReport uses JWT access tokens and role-based access control:

```txt
User -> Role -> Permission
```

Default roles are `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `VIEWER`. Default permissions include dashboard, inventory, sync, export, alerts, replenishment, stock coverage, sales performance, logistics, multi-location, stock rules, snapshots, users, and settings permissions.

Seed roles and permissions with:

```bash
npm run db:seed
```

If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set, the seed creates or updates that user and assigns `SUPER_ADMIN`. `ADMIN_EMAIL` is optional legacy metadata and is not used for login. Passwords are hashed with bcrypt. Missing admin env values only skip admin creation; roles and permissions are still seeded.

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change_me"}'
```

Protected routes require `Authorization: Bearer <token>`. `/api/health` remains public.

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
