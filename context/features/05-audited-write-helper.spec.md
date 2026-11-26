# 05 - Audited Write Helper

## Overview

Add a helper that runs database writes inside a transaction that sets `app.user_id`, so the audit triggers record who made the change (see **Audit Log** in [database-schema.md](../database-schema.md)).

## Requirements

### 1. `src/lib/audit.ts` (`server-only`)

```ts
export async function withAuditUser<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T>
```

- Runs `prisma.$transaction(async (tx) => { ... })`.
- The first statement is `` tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)` `` (parameterised, never string-concatenated).
- Then it runs `fn(tx)` and returns the result.
- `true` = transaction-local, so the setting never leaks to other requests that reuse the pooled connection.

### 2. Replace existing manual code

`authorize()` in `src/lib/auth.ts` already sets the user as the audit actor when it updates `lastLoginAt`. Switch it to `withAuditUser`, keeping the same behaviour.

### 3. Rule

Every application write to an audited table (`users`, `user_roles`, `roles`, `role_policies`, `policies`, `policy_statements`, `locations`, `production_records`, `arima_models`) must go through `withAuditUser`. Later specs rely on this.

## Out of Scope

- An audit log viewer page

## Acceptance Criteria

- [ ] Logging in still updates `lastLoginAt`, and its `audit_logs` row has `changedById` = the user's id
- [ ] Running `SELECT current_setting('app.user_id', true)` outside the transaction afterwards returns an empty value
- [ ] `npm run lint` and `npm run build` pass

## References

- Prisma interactive transactions and `$executeRaw` tagged templates (check with Context7, `/prisma/web`)
