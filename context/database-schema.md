# Database Schema

PostgreSQL 16 + Prisma ORM. Single-tenant: one deployment per client, so there is no tenant/organization table.

## Overview

Table names are lowercase, plural and snake_case. Prisma models keep PascalCase names and map to their table with `@@map`.

| Area   | Model → Table                                                                                                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth   | `User` → `users`, `LoginAttempt` → `login_attempts`                                                                                                                                                 |
| IAM    | `Role` → `roles`, `UserRole` → `user_roles`, `Policy` → `policies`, `RolePolicy` → `role_policies`, `PolicyStatement` → `policy_statements`                                                         |
| Domain | `Location` → `locations`, `ProductionRecord` → `production_records`, `ArimaModel` → `arima_models`, `ModelEvaluation` → `model_evaluations`, `Prediction` → `predictions`, `PredictionPoint` → `prediction_points` |
| Feedback | `Feedback` → `feedback`                                                                                                                                                                           |
| Audit  | `AuditLog` → `audit_logs` (populated by Postgres triggers)                                                                                                                                          |

```
users ──< user_roles >── roles ──< role_policies >── policies ──< policy_statements

locations ──< production_records
locations ──< predictions >── arima_models
predictions ──< prediction_points
locations ──< model_evaluations >── arima_models
users  ──< predictions
users  ──< feedback
```

## Authentication

- **next-auth** with the **Credentials** provider only (email + password). No OAuth, no email verification.
- The Credentials provider only supports the **JWT session strategy**, so there are no `Account`, `Session` or `VerificationToken` tables and no Prisma adapter. `authorize()` looks up the user directly.
- Passwords are hashed with **`bcryptjs`** (cost 12). bcrypt only uses the first 72 bytes, so Zod caps passwords at 72 characters.
- The JWT carries only `userId` and `tokenVersion`, never roles or permissions.
- A server-side `getCurrentUser()` helper loads the user and their permissions from the database (cached per request). A session is rejected when `isActive = false` or `tokenVersion` does not match. Incrementing `tokenVersion` forces logout.
- Every route requires login; there is no anonymous access.

### Login rate limiting

- Stored in Postgres (`login_attempts`), not in memory, because Vercel serverless instances don't share memory. No Redis.
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
- `*` is a wildcard in actions (`dataset:*`, `*`) and resources (`animo:location/*`, `*`).
- Resource format: `animo:<resource>/<id>`, e.g. `animo:location/clx123`, `animo:prediction/*`.

### Resources and actions

| Resource     | Description                                        | Actions                                                     |
| ------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| `location`   | Provinces / areas the client tracks                | `Read`, `Create`, `Update`, `Delete`                        |
| `dataset`    | Historical production records (`ProductionRecord`) | `Read`, `Create`, `Update`, `Delete`, `Import`              |
| `model`      | ARIMA model configurations                         | `Read`, `Create`, `Update`, `Delete`, `Activate`            |
| `evaluation` | MAE / RMSE / MAPE results (`ModelEvaluation`)      | `Read`, `Run`                                               |
| `prediction` | Forecast runs                                      | `Read`, `Run`, `Delete`                                     |
| `feedback`   | User ratings shown on the Evaluation screen        | `Read`, `Submit`, `Delete`                                  |
| `dashboard`  | Charts and trends                                  | `Read`                                                      |
| `iam`        | Users, roles, policies                             | `ReadUsers`, `ManageUsers`, `ManageRoles`, `ManagePolicies` |
| `audit`      | Audit log                                          | `Read`                                                      |

### Seeded roles and policies (`isSystem = true`)

| Role        | Policies                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | `AdministratorAccess`: `ALLOW *` on `*`                                                                                               |
| **Analyst** | `ALLOW location:*, dataset:*, model:*, evaluation:*, prediction:Read, prediction:Run, feedback:Read, feedback:Submit, dashboard:Read` on `*` |
| **Viewer**  | `ALLOW location:Read, dataset:Read, model:Read, evaluation:Read, prediction:Read, prediction:Run, feedback:Read, feedback:Submit, dashboard:Read` on `*` |

- Predictions and feedback are visible to every logged-in user. Only Admin can delete them.
- Because resources are named per location (`animo:location/<id>`), a policy could later restrict a user to specific locations. For now every policy uses `*`.
- System roles and policies cannot be deleted.

## ARIMA (`arima` npm package)

- Uses [`arima`](https://www.npmjs.com/package/arima) (ARIMA via WebAssembly) and runs server-side in Next.js. It may need to be listed in `serverExternalPackages`.
- Univariate ARIMA: no exogenous variables. The target is yearly `production` (MT).
- One time series per **location + irrigation status**, ordered by `year`. Data is yearly, so there is no seasonal component.
- Fitted models cannot be saved or reloaded, so `ArimaModel` stores **configuration only** (`p`, `d`, `q`) and the model is refitted on each prediction or evaluation.
- A prediction forecasts `horizon` years after the last recorded year (default 5). `predict()` returns error variances; the 95% CI is `pred ± 1.96·√variance`.
- **Production outlook**: compare the average forecast with the historical average of the series. `HIGH` if more than 5% above, `LOW` if more than 5% below, otherwise `MODERATE` (threshold is a constant in code). The UI shows `HIGH` as "Favorable" and derives the planting recommendation text from the outlook.
- Evaluation: fit on the first `n − testSize` years, predict the last `testSize`, and compute MAE / RMSE / MAPE in our own code.
- Series with missing years, or with fewer than about 10 years of data, cannot be modelled; the UI flags this (checked in code, not in the schema).

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
  feedback    Feedback[]

  @@map("users")
}

model LoginAttempt {
  id        BigInt   @id @default(autoincrement())
  email     String   // as typed (lowercased), may not match a User
  ip        String?
  success   Boolean
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([ip, createdAt])
  @@map("login_attempts")
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

  @@map("roles")
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
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

  @@map("policies")
}

model RolePolicy {
  roleId   String
  policyId String

  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  policy Policy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@id([roleId, policyId])
  @@map("role_policies")
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
  resources String[] // ["animo:location/*"]

  policy Policy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@index([policyId])
  @@map("policy_statements")
}

// ───────── Domain ─────────
enum IrrigationStatus {
  IRRIGATED
  NON_IRRIGATED
}

enum ProductionOutlook {
  HIGH
  MODERATE
  LOW
}

model Location {
  id           String   @id @default(cuid())
  province     String
  municipality String?
  barangay     String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  productionRecords ProductionRecord[]
  predictions       Prediction[]
  evaluations       ModelEvaluation[]

  @@unique([province, municipality, barangay])
  @@map("locations")
}

model ProductionRecord {
  id         String           @id @default(cuid())
  locationId String
  year       Int
  irrigation IrrigationStatus
  production Decimal          @db.Decimal(14, 2) // metric tons
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  location Location @relation(fields: [locationId], references: [id], onDelete: Restrict)

  @@unique([locationId, irrigation, year])
  @@map("production_records")
}

model ArimaModel {
  id        String   @id @default(cuid())
  name      String   @unique
  p         Int
  d         Int
  q         Int
  isActive  Boolean  @default(false) // one active model used for predictions
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  evaluations ModelEvaluation[]
  predictions Prediction[]

  @@map("arima_models")
}

model ModelEvaluation {
  id          String           @id @default(cuid())
  modelId     String
  locationId  String
  irrigation  IrrigationStatus
  trainFrom   Int              // year
  trainTo     Int              // year
  testSize    Int              // years held out
  mae         Float
  rmse        Float
  mape        Float
  evaluatedAt DateTime         @default(now())

  model    ArimaModel @relation(fields: [modelId], references: [id], onDelete: Cascade)
  location Location   @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@index([modelId, locationId, irrigation])
  @@map("model_evaluations")
}

model Prediction {
  id             String            @id @default(cuid())
  modelId        String
  locationId     String
  irrigation     IrrigationStatus
  lastActualYear Int               // last year of data the model was fitted on
  horizon        Int               // number of years forecast
  historicalAvg  Decimal           @db.Decimal(14, 2) // MT, for the outlook
  outlook        ProductionOutlook
  createdById    String
  createdAt      DateTime          @default(now())

  model     ArimaModel        @relation(fields: [modelId], references: [id], onDelete: Restrict)
  location  Location          @relation(fields: [locationId], references: [id], onDelete: Restrict)
  createdBy User              @relation(fields: [createdById], references: [id], onDelete: Restrict)
  points    PredictionPoint[]

  @@index([locationId, irrigation, createdAt])
  @@map("predictions")
}

model PredictionPoint {
  id           String  @id @default(cuid())
  predictionId String
  year         Int
  production   Decimal  @db.Decimal(14, 2) // forecast MT
  lowerBound   Decimal? @db.Decimal(14, 2) // 95% CI
  upperBound   Decimal? @db.Decimal(14, 2)

  prediction Prediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)

  @@unique([predictionId, year])
  @@map("prediction_points")
}

// ───────── Feedback ─────────
model Feedback {
  id                  String   @id @default(cuid())
  userId              String
  usability           Int      // 1–5
  clarity             Int      // 1–5
  functionality       Int      // 1–5
  practicalUsefulness Int      // 1–5
  comment             String?
  createdAt           DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([createdAt])
  @@map("feedback")
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
  @@map("audit_logs")
}
```

### Conventions

- Tables: lowercase, plural, snake_case via `@@map` (columns keep their camelCase field names). `feedback` is uncountable, so it stays singular.
- IDs: `cuid()` strings (except `AuditLog` and `LoginAttempt`, which use an auto-increment `BigInt`).
- Measurements use `Decimal`; model metrics use `Float`; ratings use `Int` (1–5, validated with Zod).
- `Location`, `ArimaModel` and `User` are deactivated with `isActive`, not deleted, when they have history (`onDelete: Restrict`).
- Feedback averages on the Evaluation screen are computed with `prisma.feedback.aggregate({ _avg })`, not stored.

## Audit Log

- Implemented with Postgres triggers that write to `audit_logs` on `INSERT` / `UPDATE` / `DELETE`. `tableName` stores the database table name (e.g. `users`), not the Prisma model name.
- **Audited tables:** `users`, `user_roles`, `roles`, `role_policies`, `policies`, `policy_statements`, `locations`, `production_records`, `arima_models`.
- **Not audited:** `predictions` and `prediction_points` (never edited; already have `createdById`), `model_evaluations` (derived data), `feedback` (never edited; already has `userId`), `login_attempts` (already a log), `audit_logs`.
- The trigger removes `passwordHash` from `users` rows before storing `oldData` / `newData`.
- **Who made the change:** application writes run inside `prisma.$transaction` that first runs `SELECT set_config('app.user_id', <userId>, true)`. The trigger reads `current_setting('app.user_id', true)` into `changedById`. Writes without it (seed, manual SQL) store `null`.
- Join tables (`user_roles`, `role_policies`) have no `id`, so `recordId` is the composite key joined with `:` (e.g. `<userId>:<roleId>`).
- The trigger function and triggers are added as raw SQL in a migration created with `prisma migrate dev --create-only` and then edited, so we never use `db push`.
