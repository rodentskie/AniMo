# 04 - IAM Authorization

## Overview

Load each user's permissions and check them on the server, following the **IAM** section of [database-schema.md](../database-schema.md). Every later feature uses these helpers to guard pages and Server Actions.

## Requirements

### 1. `src/lib/iam.ts` (`server-only`)

- `type Statement = { effect: "ALLOW" | "DENY"; actions: string[]; resources: string[] }`
- `matches(pattern: string, value: string): boolean`: `*` matches any run of characters (`dataset:*`, `animo:location/*`, `*`). Match the whole string and escape every other regex character.
- `isAllowed(statements, action, resource): boolean`:
  1. Any matching `DENY` → `false`
  2. Any matching `ALLOW` → `true`
  3. Otherwise → `false` (implicit deny)
- `resourceArn(resource: string, id = "*")` → `animo:<resource>/<id>`

### 2. Load permissions in `getCurrentUser()` (`src/lib/session.ts`)

- In the same query, include `roles → role → policies → policy → statements`.
- Flatten them into `statements: Statement[]` on the returned user. Keep the existing `isActive` / `tokenVersion` checks.
- Also return `roleNames: string[]` for display.
- Still wrapped in React `cache()`, so there is one query per request.

### 3. Guards

| Helper                                           | Use in            | On failure                                       |
| ------------------------------------------------ | ----------------- | ------------------------------------------------ |
| `requirePermission(action, resource?)`           | Server components | `redirect("/login")` if logged out, `forbidden()` if denied |
| `authorize(action, resource?)` → `CurrentUser \| null` | Server Actions | Caller returns `{ success: false, error: "You don't have permission to do that" }` |
| `can(user, action, resource?)`                   | Hiding buttons    | Returns `boolean`                                |

`resource` defaults to `animo:<resource-from-action>/*` (e.g. `dataset:Create` → `animo:dataset/*`).

### 4. Forbidden page

- Enable `experimental.authInterrupts` in `next.config.ts` so `forbidden()` works.
- Add `src/app/forbidden.tsx`: a friendly "You don't have access to this page" message with a link home.

### 5. Types

`src/types/iam.ts`: `Statement`, `CurrentUser`.

## Out of Scope

- UI for managing roles and policies
- Per-location resource restrictions (every policy still uses `*`)

## Acceptance Criteria

- [ ] `isAllowed` returns `false` when a `DENY` and an `ALLOW` both match
- [ ] `isAllowed` returns `false` when nothing matches
- [ ] `dataset:*` matches `dataset:Create` but not `datasetX:Create`; `*` matches everything
- [ ] The Admin user is allowed everything; a Viewer is denied `dataset:Create` and allowed `prediction:Run`
- [ ] `getCurrentUser()` makes one database query per request
- [ ] `npm run lint` and `npm run build` pass

## References

- [database-schema.md](../database-schema.md): IAM, resources and actions
- Next.js `forbidden()` / `authInterrupts` docs (check with Context7 before implementing)
