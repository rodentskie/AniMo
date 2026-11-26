# 08 - Historical Data Input

## Overview

Build the **Historical Data Input** form on `/data`, as on the Data / Overview screen of [context-1.jpg](../screenshots/context-1.jpg). Users save yearly rice production for a location and irrigation status.

## Requirements

### 1. Form (left column of `/data`)

| Field              | Control                                                      |
| ------------------ | ------------------------------------------------------------ |
| Location           | Chakra `Select` of active locations (`formatLocation`), labelled "Select Province" |
| Year               | Number input, placeholder "e.g. 2020"                        |
| Irrigation Status  | `RadioGroup`: Irrigated / Non-Irrigated                      |
| Rice Production (MT) | Number input, placeholder "e.g. 150000"                    |
| **Save Data**      | Submit button with loading state                             |

- Shown only if `can(user, "dataset:Create")`. Otherwise show a short read-only note.
- If no locations exist, show "Add a location first" with a link to `/settings/locations` (if allowed).

### 2. Server Action: `saveProductionRecord` in `src/actions/production.ts`

- `authorize("dataset:Create")`. If a record for the same `(locationId, irrigation, year)` exists, also require `dataset:Update`.
- Upsert on the unique key, inside `withAuditUser`.
- `revalidatePath("/data")`. Returns `{ success, data, error }`. The toast says "Saved" or "Updated".

### 3. Validation: `src/types/production.ts`

- `locationId`: cuid of an **active** location (checked in the action)
- `year`: integer, 1900 to the current year
- `irrigation`: `IRRIGATED` | `NON_IRRIGATED`
- `production`: number ≥ 0, max 2 decimals, below 10¹² (fits `Decimal(14, 2)`)

### 4. Records table

Under the chart (spec 09) or under the form: a list of the selected location's records (Year, Irrigation, Production MT), newest first, with Edit (fills the form) and Delete (`dataset:Delete`, with a confirm dialog).

## Out of Scope

- CSV import (`dataset:Import`)
- The chart (spec 09)

## Acceptance Criteria

- [ ] Saving a new year creates a `production_records` row and shows "Saved"
- [ ] Saving the same location, irrigation and year again updates it and shows "Updated"
- [ ] Invalid input (future year, negative production) shows field errors and nothing is saved
- [ ] A Viewer doesn't see the form, and the action returns the permission error
- [ ] Writes appear in `audit_logs` with `changedById`
- [ ] `npm run lint` and `npm run build` pass
