# 02 - Auth Setup and Login Page

## Overview

Set up email + password login with next-auth v4 (Credentials provider only), following the **Authentication** section of [database-schema.md](../database-schema.md). Add the `/login` page and protect every other route. After a successful login, the user is redirected to `/`.

No sign-up, no forgot password and no OAuth.

## Requirements

### 1. Dependencies

| Package            | Type       | Why                                                                                       |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `next-auth@4.24.15` | dependency | Latest stable v4. Its peer deps support Next `^16` and React `^19`                        |
| `zod`              | dependency | Validates the login input. It is only a transitive dependency now, so add it directly     |

`bcryptjs` is already installed.

### 2. Environment

Add to `.env` and `.env.example`:

```env
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` is required in production.

### 3. Files

| File                                      | Purpose                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/lib/auth.ts`                         | `authOptions: NextAuthOptions` (provider, callbacks, `pages.signIn = "/login"`)       |
| `src/lib/auth-rate-limit.ts`              | Check and record `login_attempts`                                                     |
| `src/lib/session.ts`                      | `server-only` `getCurrentUser()` wrapped in React `cache()`                           |
| `src/types/auth.ts`                       | Zod `loginSchema` and the inferred `LoginInput` type                                  |
| `src/types/next-auth.d.ts`                | Module augmentation for `Session`, `User` and `JWT` (`next-auth/jwt`)                  |
| `src/app/api/auth/[...nextauth]/route.ts` | `const handler = NextAuth(authOptions); export { handler as GET, handler as POST }`   |
| `src/app/login/page.tsx`                  | Server component with the split layout. Redirects to `/` if already logged in         |
| `src/components/auth/LoginForm.tsx`       | `'use client'` form that calls `signIn("credentials", { redirect: false, ... })`      |
| `src/components/ui/toaster.tsx`           | Chakra snippet: `npx @chakra-ui/cli snippet add toaster --outdir src/components/ui/`  |
| `src/proxy.ts`                            | Next 16 proxy (formerly `middleware.ts`) using `withAuth` from `next-auth/middleware` |

### 4. Login page (`/login`)

- **Left side:** `public/ricefields.png` fills 3/4 of the page width. Use `next/image` with `fill` and `sizes`, because the source is 4336×4336. Hide it on small screens.
- **Right side (1/4):** the login form with email, password and a submit button.
- No sign-up and no forgot-password links.
- Messages use the Chakra UI toaster, placed bottom-right (`placement: "bottom-end"`). Mount `<Toaster />` in the root layout.

### 5. `authorize(credentials, req)` flow

1. Parse `credentials` with `loginSchema`: the email is trimmed and lowercased, and the password is 1–72 characters (the bcrypt limit). Return `null` if the input is invalid.
2. Read the IP from `req.headers["x-forwarded-for"]` (first entry), falling back to `x-real-ip`.
3. If the email or the IP has 5 or more failed attempts in the last 15 minutes, throw `new Error("Too many attempts, try again later")`.
4. Find the user by email. If the user doesn't exist, is inactive, or `bcrypt.compare` fails, record a failed attempt and return `null`.
5. On success, record a successful attempt, update `User.lastLoginAt`, and return `{ id, email, name, tokenVersion }`.
6. Never reveal whether an email exists. Every failure shows the same "Invalid email or password" message, and unknown emails are recorded too.

### 6. Session / JWT

- `session: { strategy: "jwt" }`, with no Prisma adapter. The Credentials provider only works with JWT sessions.
- The JWT holds only `userId` and `tokenVersion`, never roles, permissions or `passwordHash`.
- `jwt` callback: on sign-in, copies `user.id` and `user.tokenVersion` into the token.
- `session` callback: exposes `session.user.id` and `session.tokenVersion` only. `getServerSession` returns the session, not the raw JWT, so `tokenVersion` must be on the session for `getCurrentUser()` to compare it.
- `getCurrentUser()` calls `getServerSession(authOptions)` and loads the user from the database. It returns `null` when the user is missing, `isActive = false`, or `tokenVersion` doesn't match.

### 7. Login form behaviour

- Validate on the client with the same `loginSchema` before submitting.
- `signIn("credentials", { email, password, redirect: false })` returns `{ ok, error }`.
- If `error === "CredentialsSignin"`, show the toast "Invalid email or password". Any other `error` is the message thrown in `authorize` (for example, the rate-limit message).
- On `ok`, call `router.replace("/")` and then `router.refresh()`.
- While the request is pending, disable the submit button and show a loading state.

### 8. Protected routes

- `src/proxy.ts` uses `withAuth` to redirect unauthenticated users to `/login`.
- Matcher: exclude `api/auth`, `_next/static`, `_next/image`, `favicon.ico`, `login` and static images (`.*\.png$`).
- Logged-in users who visit `/login` are redirected to `/` (checked in `src/app/login/page.tsx`).
- `/` is protected.

## Best Practices (Context7: next-auth v4 docs, Next.js 16 auth guide)

- **The proxy is only an optimistic check.** `withAuth` only verifies that the JWT cookie is valid and doesn't touch the database. The real check is `getCurrentUser()`, which runs close to the data in server components, Server Actions and route handlers (the Data Access Layer pattern).
- **No database queries in the proxy.** It runs on every request.
- **Memoise per request.** Wrap `getCurrentUser()` in React `cache()` and import `server-only`.
- **CSRF.** `signIn()` from `next-auth/react` sends the CSRF token automatically. Don't post to `/api/auth/callback/credentials` by hand.
- **No secrets in the session or token.**

## Out of Scope

- Sign-up, forgot password, OAuth providers
- Logout UI
- IAM permission evaluation and loading permissions in `getCurrentUser()`
- Vercel Cron cleanup of old `login_attempts` rows

## Acceptance Criteria

- [ ] Visiting `/` while logged out redirects to `/login`
- [ ] `/login` shows the rice field image on the left 3/4 and the form on the right; on small screens only the form is shown
- [ ] Logging in as the seeded admin redirects to `/`
- [ ] A wrong password or unknown email shows "Invalid email or password" in a bottom-right toast
- [ ] After 5 failed attempts in 15 minutes, logins for that email or IP show "Too many attempts, try again later"
- [ ] Every attempt creates a `login_attempts` row; a successful login updates `users.lastLoginAt`
- [ ] Visiting `/login` while logged in redirects to `/`
- [ ] Setting `isActive = false` or incrementing `tokenVersion` makes `getCurrentUser()` return `null`
- [ ] The JWT contains no roles, permissions or `passwordHash`
- [ ] `.env.example` includes `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- [ ] `npm run lint` and `npm run build` pass

## References

- [database-schema.md](../database-schema.md): Authentication and login rate limiting rules
- next-auth v4 docs: Credentials provider, callbacks, `withAuth` middleware, TypeScript module augmentation (Context7, `/nextauthjs/docs`)
- Next.js 16 authentication guide: Proxy optimistic checks, Data Access Layer (Context7, `/vercel/next.js/v16.2.9`)
