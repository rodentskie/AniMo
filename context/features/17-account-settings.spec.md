# 17 - Account Settings

## Overview

Build `/settings` as the settings hub and add an **Account** section where any logged-in user can update their name and change their password.

## Requirements

### 1. `/settings` page

- Login required
- **Account** section (always shown): first name, last name, email (read-only), and a change-password form
- Links to the admin sections, each shown only with permission:
  - Locations (`location:Read`, spec 07)
  - ARIMA Models (`model:Read`, spec 11)
  - Users (`iam:ReadUsers`, spec 18)

### 2. Server Actions: `src/actions/account.ts`

- `updateProfile({ firstName, lastName })`: 1–50 characters each; updates the current user via `withAuditUser`
- `changePassword({ currentPassword, newPassword, confirmPassword })`:
  - `newPassword`: 8–72 characters (bcrypt limit); must match `confirmPassword`; must differ from the current one
  - Check `currentPassword` with `bcrypt.compare`; if wrong → "Current password is incorrect"
  - Hash with cost 12, and increment `tokenVersion` in the same update (via `withAuditUser`). This logs out every other session.
  - The client then calls `signOut({ callbackUrl: "/login" })`, with the toast "Password changed. Please log in again."

### 3. Validation: `src/types/account.ts`

## Acceptance Criteria

- [ ] Updating the name changes it in the user menu
- [ ] A wrong current password shows the error, and nothing changes
- [ ] After changing the password, the user is logged out, and the old password no longer works
- [ ] The `audit_logs` row for the change has no `passwordHash`
- [ ] `npm run lint` and `npm run build` pass
