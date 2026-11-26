# 07 - Locations Management

## Overview

Let Admins and Analysts manage the locations (province, plus optional municipality and barangay) that production data is recorded for. The Data screen's location picker reads from this list.

Page: `/settings/locations`, linked from `/settings`.

## Requirements

### 1. Page

- Server component. Guard with `requirePermission("location:Read")`.
- Table: Province, Municipality, Barangay, Status (Active / Inactive), record count, actions.
- An "Add location" button opens a Chakra `Dialog` with the form. Shown only if `can(user, "location:Create")`.
- Row actions: Edit (`location:Update`), Deactivate / Activate (`location:Update`), Delete (`location:Delete`, only when the location has no production records, predictions or evaluations).
- Add a "Locations" card or link on `/settings`.

### 2. Server Actions: `src/actions/locations.ts`

- `createLocation`, `updateLocation`, `setLocationActive`, `deleteLocation`
- Each one: `authorize(...)` → validate with Zod → write with `withAuditUser` → `revalidatePath` → return `{ success, data, error }`
- The unique `(province, municipality, barangay)` error (`P2002`) returns "This location already exists".
- Deleting a location with history returns "This location has data. Deactivate it instead."

### 3. Validation: `src/types/location.ts`

- `province`: required, trimmed, 1–100 characters
- `municipality`, `barangay`: optional, trimmed, max 100; an empty string becomes `null`

### 4. Display name

`formatLocation(location)` in `src/lib/location.ts` → "Barangay, Municipality, Province", skipping empty parts (e.g. "Ladol, Alabel, Sarangani" or "Nueva Ecija").

## Out of Scope

- Map coordinates
- Importing a list of provinces

## Acceptance Criteria

- [ ] An Analyst can add, edit and deactivate a location; a Viewer sees the list but no buttons
- [ ] A Viewer calling the Server Action directly gets the permission error
- [ ] Adding a duplicate location shows "This location already exists" in a toast
- [ ] A location with production records can't be deleted, only deactivated
- [ ] Each change creates an `audit_logs` row with `changedById` set
- [ ] `npm run lint` and `npm run build` pass
