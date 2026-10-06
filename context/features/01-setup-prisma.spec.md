# 01 - Setup Prisma

## Overview

Set up Prisma ORM (v7) with PostgreSQL 16 and create the full database from [database-schema.md](../database-schema.md): schema, first migration, audit triggers, and seed data for the system roles and policies.

This feature is database work only. No pages, Server Actions, auth or IAM checks are built here.

## Requirements

### 1. Dependencies

| Package              | Type           | Why                                                                               |
| -------------------- | -------------- | --------------------------------------------------------------------------------- |
| `prisma`             | dependency     | CLI. Kept in `dependencies` because Vercel removes devDependencies during the build, and `prisma migrate deploy` must run in production |
| `@prisma/client`     | dependency     | Runtime used by the generated client                                              |
| `@prisma/adapter-pg` | dependency     | Prisma 7 driver adapter for Postgres (`pg`)                                       |
| `server-only`        | dependency     | Build error if `src/lib/prisma.ts` is imported into a client component           |
| `dotenv`             | devDependency  | Prisma 7 does not load `.env` by itself; `prisma.config.ts` loads it             |
| `tsx`                | devDependency  | Runs `prisma/seed.ts`                                                             |
| `bcryptjs`           | dependency     | Hashes the seeded admin password (cost 12)                                        |
| `@types/bcryptjs`    | devDependency  | Only if the installed `bcryptjs` version has no built-in types                    |

Prisma 7 needs Node `>= 20.19` and TypeScript `>= 5.4`.

### 2. Environment

- `.env` (gitignored by the existing `.env*` rule) holds only the connection string:

  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/animo?schema=public"
  ```

- Add `.env.example` with the same key and a placeholder value, and add `!.env.example` to `.gitignore` so it is committed.
- The local database is the existing `pg` service in [compose.yml](../../compose.yml) (`docker compose up -d`).

### 3. `prisma.config.ts` (project root)

Prisma 7 reads the datasource URL and the seed command from here, not from `schema.prisma` or `package.json`.

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### 4. `prisma/schema.prisma`

- Use the new `prisma-client` generator with an explicit `output`. The `datasource` block has **no `url`** (it lives in `prisma.config.ts`).

  ```prisma
  generator client {
    provider = "prisma-client"
    output   = "../src/generated/prisma"
  }

  datasource db {
    provider = "postgresql"
  }
  ```

- Copy every model and enum from the **Prisma Schema** section of [database-schema.md](../database-schema.md) without changes:
  - Auth: `User`, `LoginAttempt`
  - IAM: `Role`, `UserRole`, `Policy`, `RolePolicy`, `Effect`, `PolicyStatement`
  - Domain: `Season`, `Field`, `YieldRecord`, `ArimaxModel`, `ModelEvaluation`, `Prediction`
  - Audit: `AuditAction`, `AuditLog`
- Add `/src/generated/` to `.gitignore`. The client is generated on install (see scripts).

### 5. Migrations

Never use `db push`.

1. **`init`**: `npx prisma migrate dev --name init`. Creates all tables, enums and indexes.
2. **`audit_triggers`**: `npx prisma migrate dev --create-only --name audit_triggers`, then write the raw SQL by hand and apply it with `npx prisma migrate dev`. The SQL:
   - A trigger function `audit_log_trigger()` (`plpgsql`) that inserts one `AuditLog` row per changed row:
     - `tableName` = `TG_TABLE_NAME`, `action` = `TG_OP`
     - `oldData` = `to_jsonb(OLD)` on `UPDATE` / `DELETE`, `newData` = `to_jsonb(NEW)` on `INSERT` / `UPDATE`
     - For `User`, remove the key: `to_jsonb(...) - 'passwordHash'`
     - `recordId` = `id`, except `UserRole` → `userId || ':' || roleId` and `RolePolicy` → `roleId || ':' || policyId`
     - `changedById` = `NULLIF(current_setting('app.user_id', true), '')`
     - `changedAt` = `now()`
   - An `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH ROW` trigger on each audited table: `User`, `UserRole`, `Role`, `RolePolicy`, `Policy`, `PolicyStatement`, `Field`, `YieldRecord`, `ArimaxModel`.
   - No triggers on `Prediction`, `ModelEvaluation`, `LoginAttempt` or `AuditLog`.
   - Table and column names are quoted (`"User"`, `"tableName"`) because Prisma keeps their case.
3. Run `npx prisma generate` after every migration. In Prisma 7, `migrate dev` no longer runs `generate` or the seed.

### 6. Prisma Client singleton: `src/lib/prisma.ts`

One shared client, kept on `globalThis` so hot reload in development does not open new connection pools.

```ts
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- Import path must end in `/client` (Prisma 7 `prisma-client` generator).
- `prisma/seed.ts` builds its own client (it runs outside Next.js, so it cannot import `server-only`) and disconnects when done.

### 7. Seed: `prisma/seed.ts`

All initial data is defined as constants inside `prisma/seed.ts`. The only value read from `.env` is `DATABASE_URL`.

```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // seedPolicies(), seedRoles(), seedAdmin()
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- Uses a relative import (not `@/`) and its own client, because it runs with `tsx` outside Next.js and cannot import `server-only`.
- Idempotent: safe to run many times (`upsert` by unique `name` / `email`; a system policy's statements are replaced on each run).
- Each step is its own small function to keep functions under 50 lines.

Initial data:

- **Policies** (`isSystem = true`), all statements on resource `*`:
  - `AdministratorAccess`: `ALLOW *`
  - `AnalystAccess`: `ALLOW field:*, dataset:*, model:*, evaluation:*, prediction:Read, prediction:Run, dashboard:Read`
  - `ViewerAccess`: `ALLOW field:Read, dataset:Read, model:Read, evaluation:Read, prediction:Read, prediction:Run, dashboard:Read`
- **Roles** (`isSystem = true`): `Admin` → `AdministratorAccess`, `Analyst` → `AnalystAccess`, `Viewer` → `ViewerAccess`.
- **First admin user**: defined in `seed.ts` as `ADMIN_USER` (`firstName: "System"`, `lastName: "Admin"`, `email: "admin@animo.local"`, a default password). The password is hashed with `bcryptjs` (cost 12) and the user gets the `Admin` role. If the user already exists, leave the password alone so a changed password is never reset. The default password is committed to the repo, so it must be changed after the first login.
- Seed writes do not set `app.user_id`, so their audit rows have `changedById = null`.
- No demo fields, yield records or ARIMAX models. Those come with their own features.

### 8. `package.json` scripts

```json
{
  "postinstall": "prisma generate",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:status": "prisma migrate status",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio"
}
```

- `db:seed` runs `prisma db seed`, which runs the `migrations.seed` command from `prisma.config.ts` (`tsx prisma/seed.ts`). In Prisma 7 the seed is configured there, not in a `"prisma"` key in `package.json`.
- `postinstall` makes sure the generated client exists on fresh installs and on Vercel builds, because `src/generated/` is not committed.
- Production runs `npm run db:deploy` before the app starts. Vercel deploys are currently disabled ([vercel.json](../../vercel.json)), so wiring this into the deploy is left for the deploy feature.

## Out of Scope

- next-auth, `getCurrentUser()`, login rate limiting logic and the `LoginAttempt` cleanup cron
- IAM policy evaluation
- The `prisma.$transaction` + `set_config('app.user_id', ...)` helper for audited writes (the triggers already read it)
- ARIMAX code (`arima` package)
- Any UI

## Notes

- `Decimal` fields come back as `Prisma.Decimal` objects, which cannot be passed from server components to client components. Convert them (`.toNumber()` / `.toString()`) when those features are built.
- `BigInt` ids (`AuditLog`, `LoginAttempt`) cannot go through `JSON.stringify` either; convert them to strings in the same way.

## Acceptance Criteria

- [ ] `docker compose up -d` then `npx prisma migrate dev` applies `init` and `audit_triggers` without errors
- [ ] `npx prisma migrate status` reports the database is up to date
- [ ] `npm run db:seed` creates the 3 policies, 3 roles and the admin user; running it again does not create duplicates or fail
- [ ] `.env` contains only `DATABASE_URL`
- [ ] After seeding, `AuditLog` has rows for `Role`, `Policy`, `PolicyStatement`, `RolePolicy`, `User` and `UserRole` with `changedById = null`, and no `User` row contains `passwordHash`
- [ ] `src/generated/` is gitignored and recreated by `npm install`
- [ ] `.env.example` is committed; `.env` is not
- [ ] `npm run lint` and `npm run build` pass

## References

- [database-schema.md](../database-schema.md): models, IAM seed data, audit log rules
- Prisma 7 docs: `prisma.config.ts`, `prisma-client` generator, `@prisma/adapter-pg`, seeding, deploying to Vercel (fetched with Context7, `/prisma/web`)
