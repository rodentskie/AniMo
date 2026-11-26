# 03 - Prisma ARIMA Update

## Overview

Move the database from the old ARIMAX design to the ARIMA design in [database-schema.md](../database-schema.md). The domain is now yearly rice production per location and irrigation status, with multi-year forecasts and user feedback.

This feature is database work only: schema, one migration (with audit triggers), seed. No UI.

## Requirements

### 1. `prisma/schema.prisma`

Copy the **Prisma Schema** section of [database-schema.md](../database-schema.md):

- **Remove:** `Season`, `Field`, `YieldRecord`, `ArimaxModel`, the old `Prediction`
- **Add:** `IrrigationStatus`, `ProductionOutlook`, `Location`, `ProductionRecord`, `ArimaModel`, `PredictionPoint`, `Feedback`
- **Change:** `ModelEvaluation` (`locationId`, `irrigation`, years instead of seasons), `Prediction` (now a forecast run), `User` (new `feedback` relation)
- Auth, IAM and Audit models stay the same

### 2. Migration `arima_domain`

Keep the existing `init` and `audit_triggers` migrations. Add one new migration:

1. `npx prisma migrate dev --create-only --name arima_domain`
2. Check the generated SQL: it drops `fields`, `yield_records`, `arimax_models`, the old `predictions` and `model_evaluations`, and the `Season` enum, then creates the new tables. No data needs to be kept, because no domain data exists yet.
3. Append the trigger SQL by hand. It reuses the existing `audit_log_trigger()` function:
   - `CREATE TRIGGER audit_location ... ON "locations"`
   - `CREATE TRIGGER audit_production_record ... ON "production_records"`
   - `CREATE TRIGGER audit_arima_model ... ON "arima_models"`
   - The triggers on the dropped tables are removed with the tables. Use `DROP TRIGGER IF EXISTS` only if the generated SQL doesn't drop those tables.
4. Apply with `npx prisma migrate dev`, then `npm run db:generate`.

No triggers on `predictions`, `prediction_points`, `model_evaluations` or `feedback`.

### 3. Seed: `prisma/seed.ts`

Update `SYSTEM_POLICIES` to match the **Seeded roles and policies** table:

- `AnalystAccess`: `location:*, dataset:*, model:*, evaluation:*, prediction:Read, prediction:Run, feedback:Read, feedback:Submit, dashboard:Read`
- `ViewerAccess`: `location:Read, dataset:Read, model:Read, evaluation:Read, prediction:Read, prediction:Run, feedback:Read, feedback:Submit, dashboard:Read`
- Update the `AnalystAccess` description ("fields" → "locations")

The seed already replaces a system policy's statements on each run, so existing databases get the new actions after `npm run db:seed`.

### 4. Text fixes

Prisma's generated types change, so fix every compile error. Also replace the ARIMAX wording:

- `src/app/layout.tsx` metadata description → "AniMo estimates rice production using an ARIMA (Autoregressive Integrated Moving Average) time-series model."
- `src/components/home/Hero.tsx` → "An ARIMA-Based Web Platform for Estimating Rice Production"

## Out of Scope

- The `arima` package and forecasting code (spec 10)
- Any UI for locations, data, predictions or feedback

## Acceptance Criteria

- [ ] `npx prisma migrate dev` applies `arima_domain` without errors on a database that already has `init` and `audit_triggers`
- [ ] `npx prisma migrate status` reports the database is up to date
- [ ] Inserting a `locations` row creates an `audit_logs` row with `tableName = 'locations'`; inserting a `feedback` row creates none
- [ ] `npm run db:seed` runs twice without errors, and `AnalystAccess` / `ViewerAccess` have the new actions
- [ ] No "ARIMAX" text is left in `src/` (outside `src/generated/`)
- [ ] `npm run lint` and `npm run build` pass

## References

- [database-schema.md](../database-schema.md): Prisma schema, IAM seed data, audit log rules
- [01-setup-prisma.spec.md](01-setup-prisma.spec.md): migration and seed conventions
