# 11 - ARIMA Model Settings

## Overview

Let Admins and Analysts manage ARIMA model configurations (`p`, `d`, `q`) and choose the one active model used for predictions.

Page: `/settings/models`, linked from `/settings`.

## Requirements

### 1. Page

- `requirePermission("model:Read")`
- Table: Name, Order shown as `ARIMA(p, d, q)`, Active badge, Created, actions
- "Add model" dialog (`model:Create`): Name, p, d, q
- Row actions: Edit (`model:Update`), Set active (`model:Activate`), Delete (`model:Delete`, only if the model has no predictions)

### 2. Server Actions: `src/actions/models.ts`

- `createModel`, `updateModel`, `activateModel`, `deleteModel`, following the usual pattern (`authorize` → Zod → `withAuditUser` → `revalidatePath` → `{ success, data, error }`)
- `activateModel` sets `isActive = false` on every other model and `true` on the chosen one, in the same transaction, so exactly one model is active.
- Editing a model that has predictions is blocked: "This model has predictions. Create a new model instead." (old predictions must keep their meaning)

### 3. Validation: `src/types/model.ts`

- `name`: 1–50 characters, unique (`P2002` → "Name already used")
- `p`, `q`: integers 0–5; `d`: integer 0–2

### 4. Seed

Add a default active model to `prisma/seed.ts`: `name: "ARIMA(1,1,1)"`, `p: 1, d: 1, q: 1`, `isActive: true`. Upsert by name, and don't change `isActive` if it already exists.

## Out of Scope

- AutoARIMA

## Acceptance Criteria

- [ ] After `npm run db:seed`, `ARIMA(1,1,1)` exists and is active
- [ ] Activating another model leaves exactly one active model
- [ ] A Viewer sees the list without buttons
- [ ] A model with predictions can't be edited or deleted
- [ ] `npm run lint` and `npm run build` pass
