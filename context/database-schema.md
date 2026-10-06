# Database Schema

PostgreSQL 16 + Prisma ORM. Single-tenant: one deployment per client, so there is no tenant/organization table.

## Overview

| Area   | Tables                                                          |
| ------ | --------------------------------------------------------------- |
| Auth   | `User`, `LoginAttempt`                                          |
| IAM    | `Role`, `UserRole`, `Policy`, `RolePolicy`, `PolicyStatement`   |
| Domain | `Field`, `YieldRecord`, `ArimaxModel`, `ModelEvaluation`, `Prediction` |
| Audit  | `AuditLog` (populated by Postgres triggers)                     |

```
User ──< UserRole >── Role ──< RolePolicy >── Policy ──< PolicyStatement

Field ──< YieldRecord
Field ──< Prediction >── ArimaxModel
Field ──< ModelEvaluation >── ArimaxModel
User  ──< Prediction
```

## Authentication

- **next-auth** with the **Credentials** provider only (email + password). No OAuth, no email verification.
- The Credentials provider only supports the **JWT session strategy**, so there are no `Account`, `Session` or `VerificationToken` tables and no Prisma adapter. `authorize()` looks up the user directly.
- Passwords are hashed with **`bcryptjs`** (cost 12). bcrypt only uses the first 72 bytes, so Zod caps passwords at 72 characters.
- The JWT carries only `userId` and `tokenVersion`, never roles or permissions.
- A server-side `getCurrentUser()` helper loads the user and their permissions from the database (cached per request). A session is rejected when `isActive = false` or `tokenVersion` does not match. Incrementing `tokenVersion` forces logout.
- Every route requires login; there is no anonymous access.

### Login rate limiting

- Stored in Postgres (`LoginAttempt`), not in memory, because Vercel serverless instances don't share memory. No Redis.
- In `authorize()`, before checking the password: reject the login if the **email** or the **IP** has **5 or more failed attempts in the last 15 minutes**. Show a generic "Too many attempts, try again later" message.
- Every attempt is recorded, successful or not. On success, `User.lastLoginAt` is updated.
- Unknown emails are recorded too, so attackers can't use the limit to check which emails exist.
- Old rows (older than 30 days) are deleted by a scheduled cleanup (Vercel Cron).
- Upgrade path: switch to Upstash Redis + `@upstash/ratelimit` if more endpoints need rate limiting or traffic grows.

## IAM (AWS-IAM-style RBAC)

- **Policy**: a named, reusable set of statements, like an AWS managed policy.
- **PolicyStatement**: `effect` (`ALLOW` / `DENY`) + `actions[]` + `resources[]`.
- **Role**: a bundle of policies, assigned to users (many-to-many).
- **Evaluation**: an explicit `DENY` wins, then any `ALLOW`, otherwise denied (implicit deny).
- `*` is a wildcard in actions (`dataset:*`, `*`) and resources (`animo:field/*`, `*`).
- Resource format: `animo:<resource>/<id>`, e.g. `animo:field/clx123`, `animo:prediction/*`.

### Resources and actions

| Resource     | Description                                   | Actions                                                   |
| ------------ | --------------------------------------------- | --------------------------------------------------------- |
| `field`      | Rice fields/assets of the client              | `Read`, `Create`, `Update`, `Delete`                      |
| `dataset`    | Historical yield records (`YieldRecord`)      | `Read`, `Create`, `Update`, `Delete`, `Import`            |
| `model`      | ARIMAX model configurations                   | `Read`, `Create`, `Update`, `Delete`, `Activate`          |
| `evaluation` | MAE / RMSE / MAPE results (`ModelEvaluation`) | `Read`, `Run`                                             |
| `prediction` | Yield estimation runs                         | `Read`, `Run`, `Delete`                                   |
| `dashboard`  | Charts and trends                             | `Read`                                                    |
| `iam`        | Users, roles, policies                        | `ReadUsers`, `ManageUsers`, `ManageRoles`, `ManagePolicies` |
| `audit`      | Audit log                                     | `Read`                                                    |

### Seeded roles and policies (`isSystem = true`)

| Role        | Policies                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- |
| **Admin**   | `AdministratorAccess`: `ALLOW *` on `*`                                                      |
| **Analyst** | `ALLOW field:*, dataset:*, model:*, evaluation:*, prediction:Read, prediction:Run, dashboard:Read` on `*` |
| **Viewer**  | `ALLOW field:Read, dataset:Read, model:Read, evaluation:Read, prediction:Read, prediction:Run, dashboard:Read` on `*` |

- Predictions are visible to every logged-in user (`prediction:Read` on `animo:prediction/*` for all roles). Only Admin can delete them.
- Because resources are named per field (`animo:field/<id>`), a policy could later restrict a user to specific fields. For now every policy uses `*`.
- System roles and policies cannot be deleted.

## ARIMAX (`arima` npm package)

- Uses [`arima`](https://www.npmjs.com/package/arima) (SARIMAX via WebAssembly) and runs server-side in Next.js. It may need to be listed in `serverExternalPackages`.
- Fitted models cannot be saved or reloaded, so `ArimaxModel` stores **configuration only** and the model is refitted per field on each prediction or evaluation. This is fast: about 5–35 ms for 24 seasons in testing.
- One time series per field, ordered by `(year, season)` with `WET` before `DRY`. The seasonal period is `s = 2`.
- Exogenous inputs are `rainfall` and `temperature`. The target is `yieldPerHa`. Estimated production = `estimatedYield × farmArea`.
- `predict()` returns error variances; the 95% CI is `pred ± 1.96·√variance`.
- Evaluation: fit on the first `n − testSize` seasons, predict the last `testSize`, and compute MAE / RMSE / MAPE in our own code.
- Fields with gaps in their seasons, or with fewer than about 10 seasons of data, cannot be modelled; the UI flags this (checked in code, not in the schema).

## Prisma Schema

```prisma
// ───────── Auth ─────────
model User {
  id           String    @id @default(cuid())
  firstName    String
  lastName     String
  email        String    @unique
  passwordHash String    // bcryptjs
  isActive     Boolean   @default(true)
  tokenVersion Int       @default(0)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  roles       UserRole[]
  predictions Prediction[]
}

model LoginAttempt {
  id        BigInt   @id @default(autoincrement())
  email     String   // as typed (lowercased), may not match a User
  ip        String?
  success   Boolean
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([ip, createdAt])
}

// ───────── IAM ─────────
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users    UserRole[]
  policies RolePolicy[]
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model Policy {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  statements PolicyStatement[]
  roles      RolePolicy[]
}

model RolePolicy {
  roleId   String
  policyId String

  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  policy Policy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@id([roleId, policyId])
}

enum Effect {
  ALLOW
  DENY
}

model PolicyStatement {
  id        String   @id @default(cuid())
  policyId  String
  effect    Effect   @default(ALLOW)
  actions   String[] // ["dataset:Read", "prediction:*"]
  resources String[] // ["animo:field/*"]

  policy Policy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@index([policyId])
}

// ───────── Domain ─────────
enum Season {
  WET
  DRY
}

model Field {
  id           String   @id @default(cuid())
  code         String   @unique
  name         String
  province     String?
  municipality String?
  barangay     String?
  areaHa       Decimal  @db.Decimal(12, 2)
  latitude     Decimal? @db.Decimal(9, 6)
  longitude    Decimal? @db.Decimal(9, 6)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  yieldRecords YieldRecord[]
  predictions  Prediction[]
  evaluations  ModelEvaluation[]
}

model YieldRecord {
  id            String   @id @default(cuid())
  fieldId       String
  year          Int
  season        Season
  areaHarvested Decimal  @db.Decimal(12, 2) // hectares
  production    Decimal  @db.Decimal(14, 2) // metric tons
  yieldPerHa    Decimal  @db.Decimal(8, 3)  // t/ha
  rainfall      Decimal  @db.Decimal(8, 2)  // mm
  temperature   Decimal  @db.Decimal(5, 2)  // °C
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  field Field @relation(fields: [fieldId], references: [id], onDelete: Restrict)

  @@unique([fieldId, year, season])
}

model ArimaxModel {
  id        String   @id @default(cuid())
  name      String   @unique
  p         Int
  d         Int
  q         Int
  P         Int      @default(0)
  D         Int      @default(0)
  Q         Int      @default(0)
  s         Int      @default(2)
  exogVars  String[] // ["rainfall", "temperature"]
  isActive  Boolean  @default(false) // one active model used for predictions
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  evaluations ModelEvaluation[]
  predictions Prediction[]
}

model ModelEvaluation {
  id          String   @id @default(cuid())
  modelId     String
  fieldId     String
  trainFrom   Int      // year
  trainTo     Int      // year
  testSize    Int      // seasons held out
  mae         Float
  rmse        Float
  mape        Float
  evaluatedAt DateTime @default(now())

  model ArimaxModel @relation(fields: [modelId], references: [id], onDelete: Cascade)
  field Field       @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([modelId, fieldId])
}

model Prediction {
  id             String   @id @default(cuid())
  modelId        String
  fieldId        String
  year           Int
  season         Season
  farmArea       Decimal  @db.Decimal(12, 2)
  rainfall       Decimal  @db.Decimal(8, 2)
  temperature    Decimal  @db.Decimal(5, 2)
  estimatedYield Decimal  @db.Decimal(8, 3)  // t/ha
  estimatedProd  Decimal  @db.Decimal(14, 2) // estimatedYield × farmArea
  lowerBound     Decimal? @db.Decimal(8, 3)  // 95% CI
  upperBound     Decimal? @db.Decimal(8, 3)
  createdById    String
  createdAt      DateTime @default(now())

  model     ArimaxModel @relation(fields: [modelId], references: [id], onDelete: Restrict)
  field     Field       @relation(fields: [fieldId], references: [id], onDelete: Restrict)
  createdBy User        @relation(fields: [createdById], references: [id], onDelete: Restrict)

  @@index([fieldId, createdAt])
}

// ───────── Audit ─────────
enum AuditAction {
  INSERT
  UPDATE
  DELETE
}

model AuditLog {
  id          BigInt      @id @default(autoincrement())
  tableName   String
  recordId    String
  action      AuditAction
  oldData     Json?
  newData     Json?
  changedById String?     // from app.user_id; null = system/seed
  changedAt   DateTime    @default(now())

  @@index([tableName, recordId])
  @@index([changedAt])
}
```

### Conventions

- IDs: `cuid()` strings (except `AuditLog` and `LoginAttempt`, which use an auto-increment `BigInt`).
- Measurements use `Decimal`; model metrics use `Float`.
- `Field`, `ArimaxModel` and `User` are deactivated with `isActive`, not deleted, when they have history (`onDelete: Restrict`).

## Audit Log

- Implemented with Postgres triggers that write to `AuditLog` on `INSERT` / `UPDATE` / `DELETE`.
- **Audited tables:** `User`, `UserRole`, `Role`, `RolePolicy`, `Policy`, `PolicyStatement`, `Field`, `YieldRecord`, `ArimaxModel`.
- **Not audited:** `Prediction` (never edited; already has `createdById`), `ModelEvaluation` (derived data), `LoginAttempt` (already a log), `AuditLog`.
- The trigger removes `passwordHash` from `User` rows before storing `oldData` / `newData`.
- **Who made the change:** application writes run inside `prisma.$transaction` that first runs `SELECT set_config('app.user_id', <userId>, true)`. The trigger reads `current_setting('app.user_id', true)` into `changedById`. Writes without it (seed, manual SQL) store `null`.
- Join tables (`UserRole`, `RolePolicy`) have no `id`, so `recordId` is the composite key joined with `:` (e.g. `<userId>:<roleId>`).
- The trigger function and triggers are added as raw SQL in a migration created with `prisma migrate dev --create-only` and then edited, so we never use `db push`.
