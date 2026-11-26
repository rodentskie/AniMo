# 18 - User Management

## Overview

Let Admins create users, assign roles, deactivate users and reset passwords. There is no sign-up, so this is the only way to add users.

Page: `/settings/users`.

## Requirements

### 1. Page

- `requirePermission("iam:ReadUsers")`
- Table: Name, Email, Roles (badges), Status, Last login, actions
- Buttons and actions need `iam:ManageUsers`:
  - **Add user** dialog: first name, last name, email, roles (checkboxes of all roles), temporary password
  - **Edit**: name and roles
  - **Deactivate / Activate**: sets `isActive`; deactivating also increments `tokenVersion`, which logs the user out
  - **Reset password**: sets a new temporary password and increments `tokenVersion`

### 2. Server Actions: `src/actions/users.ts`

- `createUser`, `updateUser`, `setUserActive`, `resetUserPassword`
- Usual pattern: `authorize("iam:ManageUsers")` → Zod (`src/types/user.ts`) → `withAuditUser` → `revalidatePath` → `{ success, data, error }`
- Email trimmed, lowercased and unique (`P2002` → "Email already used"). Passwords 8–72 characters, bcrypt cost 12.
- Role changes replace the user's `user_roles` rows in the same transaction.
- **Safety rules:**
  - An admin can't deactivate themselves or remove their own Admin role
  - The last active user with the Admin role can't be deactivated or lose that role
- Users are never deleted, only deactivated.

## Out of Scope

- Managing roles and policies (`iam:ManageRoles`, `iam:ManagePolicies`); the seeded system roles are enough for now
- Emailing passwords

## Acceptance Criteria

- [ ] An Admin can create a Viewer, who can then log in with the temporary password
- [ ] Deactivating a user logs them out on their next request
- [ ] An admin can't deactivate themselves or remove the last Admin
- [ ] An Analyst or Viewer gets the forbidden page at `/settings/users`
- [ ] User and role changes appear in `audit_logs` without `passwordHash`
- [ ] `npm run lint` and `npm run build` pass
