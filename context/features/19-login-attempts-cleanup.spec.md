# 19 - Login Attempts Cleanup

## Overview

Delete `login_attempts` rows older than 30 days with a daily Vercel Cron job, as described under **Login rate limiting** in [database-schema.md](../database-schema.md).

## Requirements

### 1. Route handler: `src/app/api/cron/cleanup-login-attempts/route.ts`

- `GET` only
- Checks `Authorization: Bearer ${process.env.CRON_SECRET}`. Vercel sends this header automatically when `CRON_SECRET` is set. Returns `401` otherwise.
- `prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: <now − 30 days> } } })`
- Returns `{ deleted: number }`
- `RETENTION_DAYS = 30` constant

### 2. Proxy

Exclude `api/cron` from the `withAuth` matcher in `src/proxy.ts`. The route does its own secret check.

### 3. Config

- `vercel.json`: add `"crons": [{ "path": "/api/cron/cleanup-login-attempts", "schedule": "0 3 * * *" }]`. Keep the existing settings.
- `.env.example`: add `CRON_SECRET=""`

## Acceptance Criteria

- [ ] Calling the route without the secret returns 401
- [ ] With the secret, rows older than 30 days are deleted and newer ones are kept
- [ ] `npm run lint` and `npm run build` pass

## References

- Vercel Cron Jobs: securing with `CRON_SECRET` (check with Context7 before implementing)
