# 06 - App Navigation

## Overview

Update the shared navbar to match the mockups ([context-1.jpg](../screenshots/context-1.jpg), [context-2.jpg](../screenshots/context-2.jpg)) and add a user menu with logout. Add empty placeholder pages so every link works; later specs fill them in.

## Requirements

### 1. Routes (`src/lib/nav.ts`)

| Label               | Route            | Icon (`react-icons/lu`) |
| ------------------- | ---------------- | ----------------------- |
| Home                | `/`              | `LuHouse`               |
| Data                | `/data`          | `LuChartColumn`         |
| Prediction          | `/prediction`    | `LuTrendingUp`          |
| Evaluation          | `/evaluation`    | `LuClipboardCheck`      |
| Definition of Terms | `/terms`         | `LuBookOpen`            |
| Settings            | `/settings`      | `LuSettings`            |

- The top bar shows Home, Data, Prediction and Evaluation, as in the dashboard mockup.
- Definition of Terms and Settings go in the user menu, and in the phone menu with all the other links.
- Mark the current page with `aria-current` (already done for exact matches). Also match child routes, e.g. `/settings/users` highlights Settings.

### 2. User menu

- Chakra `Menu` with an avatar icon button on the right of the navbar, next to the color mode toggle.
- Shows the user's full name and role names (`getCurrentUser()` from the server layout, passed as props).
- Items: Definition of Terms, Settings, **Log out**.
- Log out calls `signOut({ callbackUrl: "/login" })` from `next-auth/react`.

### 3. Placeholder pages

`src/app/{data,prediction,evaluation,terms,settings}/page.tsx`: a server component with the page heading only. Each calls `getCurrentUser()` and redirects to `/login` if it is `null`.

### 4. Get Started

Point the home page "Get Started" button to `/data`.

## Out of Scope

- Page contents (later specs)
- A sidebar layout (the top bar plus menus covers the same links)

## Acceptance Criteria

- [ ] Every nav link opens a page, with no `#` links left
- [ ] The current page is highlighted, including on child routes
- [ ] The user menu shows the logged-in user's name and roles
- [ ] Log out returns to `/login`, and visiting `/data` afterwards redirects to `/login`
- [ ] On phones, all six links are in the menu
- [ ] `npm run lint` and `npm run build` pass
