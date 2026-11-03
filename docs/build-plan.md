# Tenant Dashboard — Build Plan

Status: draft for review
Scope: tenant-facing web dashboard (cafe owner / manager / staff), not the customer app and not the platform super-admin app.

## 1. Locked decisions

- **First milestone:** core operations MVP — auth/session, dashboard shell, branches & tables, menu, orders/POS, KDS, bills & checkout.
- **Tenant resolution:** subdomain when present, with a workspace-slug field on the login form as fallback. A local default slug comes from env.
- **Backend:** local NestJS API (`http://localhost:3000`) with a seeded tenant and owner login.
- **Stack:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind v4, shadcn `base-nova` on `@base-ui/react`, Phosphor icons.
- **Auth model:** backend-for-frontend (BFF). The browser never calls the Nest API directly; Next route handlers and server actions attach `Authorization` and `X-Tenant-Id`. Tokens live in `httpOnly` cookies.
- **Branch context:** explicit in the URL for branch-scoped screens (`/b/[branchId]/...`), not only in a cookie.

## 2. Architecture

```
Browser
  │  same-origin fetch / form action
  ▼
Next.js (App Router)
  ├── proxy.ts            tenant subdomain -> x-tenant-slug header
  ├── RSC pages           read via apiFetch(), session from cookies
  ├── server actions      mutations, zod validation, revalidatePath
  └── route handlers      login/logout/refresh, downloads, socket token
        │
        ▼
NestJS API  (Authorization + X-Tenant-Id)
```

Why BFF:

- Avoids browser CORS configuration and exposing the API directly.
- Keeps access/refresh tokens out of `localStorage`.
- Lets us inject the tenant header consistently.
- Lets us strip/normalize raw `snake_case` rows before they reach components.

Trade-off: the KDS WebSocket needs the access token in the client handshake. A same-origin `/api/realtime/token` route will return the current short-lived access token solely for the socket. This is the one place the token is readable by JS; document it and keep the endpoint same-origin/`no-store`.

## 3. Tenant resolution and session

### Subdomain

`proxy.ts` (Next 16 renamed middleware to proxy):

1. Read `x-forwarded-host` when deployed behind a proxy, otherwise `host`.
2. Strip the port. Ignore `www`, `localhost`, IP literals, and the configured `DASHBOARD_ROOT_DOMAIN` apex.
3. If the host ends with `.${DASHBOARD_ROOT_DOMAIN}`, the first label is the tenant slug.
4. Set `x-tenant-slug` on the forwarded request headers; also set a `x-tenant-source` marker.
5. Do not overwrite an incoming `x-tenant-slug` from the client; always replace it.

Local dev: `beanhouse.localhost:3001` works in Chromium. Fallback: the login form's workspace field, defaulting to `DEFAULT_TENANT_SLUG`.

### Login slug

If no subdomain slug is present, the login form submits `tenantSlug` together with email/password. The login route handler sends that as `X-Tenant-Id`. On success it stores the slug in a host-only `bliss_tenant` cookie.

If a resolved subdomain and the session cookie disagree, clear the session and redirect to login for the resolved tenant. This prevents using a session from one tenant on another tenant's subdomain.

### Cookies

| Cookie | Contents | Notes |
|---|---|---|
| `bliss_access` | access token | `httpOnly`, `sameSite=lax`, `secure` in prod, short max-age |
| `bliss_refresh` | rotating refresh token | `httpOnly`, `sameSite=lax`, `secure` in prod |
| `bliss_tenant` | tenant slug | `httpOnly`; used when no subdomain |

Do **not** set a `Domain` attribute: host-only cookies keep tenants isolated on separate subdomains.

### Refresh strategy

- `SessionKeeper` client component in the dashboard layout calls `POST /api/auth/refresh` every 10 minutes and on `visibilitychange` when the tab becomes visible.
- The refresh route handler single-flights concurrent refreshes per refresh token, rotates both cookies, and never returns token values.
- Server actions and route handlers retry once on `401` by refreshing inline.
- RSC reads that hit `401` redirect to `/api/auth/refresh?next=<path>`; the handler refreshes, sets cookies, and redirects back.
- `proxy.ts` does not refresh tokens. It only resolves the tenant and does an optimistic "is there a session cookie?" check. Keep proxy fast.

### Auth routes

- `POST /api/auth/login` — validates origin, calls `POST /auth/login`, sets cookies.
- `POST /api/auth/logout` — calls `POST /auth/logout`, clears cookies.
- `POST /api/auth/refresh` — rotates tokens.
- `GET /api/auth/socket-token` — returns the access token for Socket.IO only; `no-store`.

`GET /auth/me` is the source of truth for the session user, tenant, branch, role, and subscription. Cache it per request with React `cache()`; never put it in the Next data cache.

## 4. Route map

```
app/
  login/page.tsx
  (dashboard)/
    layout.tsx                     # requireSession + shell
    page.tsx                       # redirect to branch/overview or /branches
    branches/
      page.tsx                     # list/create/deactivate
      [branchId]/page.tsx          # edit branch
    b/[branchId]/
      layout.tsx                   # requireBranchAccess
      overview/page.tsx
      orders/page.tsx
      orders/new/page.tsx          # POS
      orders/[orderId]/page.tsx
      bills/[billId]/page.tsx
      tables/page.tsx
      menu/page.tsx
      inventory/
        page.tsx                   # items
        suppliers/page.tsx
        recipes/page.tsx
        discrepancies/page.tsx
      staff/page.tsx
      reports/page.tsx
    crm/
      customers/page.tsx
      customers/[customerId]/page.tsx
      promotions/page.tsx
      promotions/[promotionId]/page.tsx
    billing/page.tsx
    settings/payments/page.tsx
    settings/notifications/page.tsx
  kds/[branchId]/page.tsx          # full-screen, minimal chrome
  api/
    auth/{login,logout,refresh,socket-token}/route.ts
    payments/order/[orderId]/route.ts       # polling proxy
    downloads/reports/[branchId]/[type]/route.ts
    downloads/payroll/[branchId]/route.ts
proxy.ts
```

Org-wide screens (`branches`, `crm`, `billing`, `settings`) live outside the branch segment. Operational screens live under `/b/[branchId]/...` so the branch is always explicit and shareable.

## 5. API integration rules

These are the non-obvious behaviors the dashboard must encode.

- **Tenant header:** every tenant route, including login, needs `X-Tenant-Id: <slug-or-uuid>`. Onboarding and `/platform/*` do not; the dashboard does not use either.
- **Roles:** `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter`, `kitchen_staff`, `customer`. Reject `customer` from the dashboard. Treat `super_admin` as org-wide if it reaches tenant routes.
- **Branch scope:** enforced only on orders, branches, and menu. A branch-confined token gets a filtered `/branches` list and `403` for another branch. Inventory, staff, CRM, and reports are still tenant-wide; enforce UI scoping anyway and expect the API to widen later.
- **Subscription:** `past_due` is read-only (writes return `402`); `cancelled` refuses everything except `/auth`, `/billing`, `/onboarding`, `/platform`, `/webhooks`. Show a persistent billing banner and disable writes. Never log the user out on `402`.
- **Money:** many raw rows are `snake_case` and `NUMERIC` values arrive as strings (`"29.00"`). Computed objects use `camelCase` numbers. Normalize at the API boundary; never do client-side money arithmetic for order totals.
- **Errors:** `message` is a string or an array of strings. Preserve the array for form field errors.
- **Rate limits:** default 300/min per route/client; login 20/min; refresh 30/min. Do not poll aggressively. Payment polling is 3 s only while a checkout dialog is open.
- **Orders:** never send `unitPrice`, `subtotal`, or `totalAmount`. Send `taxAmount`/`discountAmount` only when intentionally applied. `clientActionId` is the idempotency key; generate one per submit and reuse it on retry.
- **Order transitions:** use the documented graph; `paid` normally arrives from the payment webhook, not a client transition.
- **KDS socket:** namespace `/kds`, token in `auth`, not a query string. Connect with `transports: ["websocket"]`; handle `connect_error` by refreshing the token once.
- **Reports:** `from` and `to` are required together; `format=json|csv|pdf`. CSV/PDF are binary downloads and need an authenticated BFF route; do not use a plain `<a href>`.
- **Billing:** this is the tenant's SaaS subscription, not guest payment. It is exempt from the subscription gate.
- **No pagination:** most list endpoints return everything. `/customers` is capped at 200. Design tables for that reality and request backend pagination later.
- **No `/health`:** `GET /` returns `Hello World!` but still requires tenant resolution.

## 6. RBAC matrix

Define `lib/auth/rbac.ts` with a `Role` union and `can(role, action)`. Navigation and buttons consume the same map; server actions re-check. The API remains the final authority.

| Capability | Roles |
|---|---|
| View branches/tables | all staff |
| Create/update/deactivate branch, create table | `super_admin`, `org_owner`, `branch_manager` |
| View menu | all staff |
| Manage branch menu | `super_admin`, `org_owner`, `branch_manager` |
| Manage org-wide menu | `super_admin`, `org_owner` |
| Create order | `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter` |
| Transition order | above + `kitchen_staff` |
| View orders/KDS | all staff |
| Checkout order / list payments | `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter` |
| Refund | `super_admin`, `org_owner`, `branch_manager` |
| Payment provider config | `super_admin`, `org_owner` |
| Inventory write | `super_admin`, `org_owner`, `branch_manager` |
| Inventory read | above + `receptionist`, `kitchen_staff` |
| Shifts / payroll / wage rates | `super_admin`, `org_owner`, `branch_manager` (read also `receptionist`) |
| Clock in/out | all staff |
| CRM customers | `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter` |
| Promotions write | `super_admin`, `org_owner`, `branch_manager` |
| Promotions read/apply | above + `receptionist`, `waiter` |
| Announce birthdays/promotions | `super_admin`, `org_owner` |
| Reports | `super_admin`, `org_owner`, `branch_manager` |
| Billing | `super_admin`, `org_owner` |
| Notification dead-letter | `super_admin`, `org_owner`, `branch_manager` |

## 7. Data layer

- `lib/api/config.ts` — zod-validated env. Server-only.
- `lib/api/server.ts` — `apiFetch<T>()` adds auth/tenant headers, parses JSON/204, throws `ApiError`, and supports a `raw` mode for downloads.
- `lib/api/endpoints/*.ts` — typed endpoint functions, one file per domain.
- `lib/api/types.ts` — raw API shapes (`snake_case` where the API says so) plus computed shapes.
- `lib/api/normalizers.ts` — map raw rows to view models, parse money strings, fill defaults.
- `lib/api/errors.ts` — `ApiError` with `status`, `message: string | string[]`, `error`, `retryAfter`; helpers for `isUnauthorized`, `isSubscriptionBlocked`, `isForbidden`.

Reads happen in RSC and use `cache: "no-store"` plus `React.cache()` for per-request dedupe. Never use `unstable_cache` for authenticated data. Mutations use server actions and call `revalidatePath()` / `revalidateTag()`.

No generic catch-all proxy: it would create an SSRF/open-proxy surface. Route handlers are explicit and typed.

## 8. UI plan

### Shell

- Sidebar sections: Overview, Orders, KDS, Tables, Menu, Inventory, Staff, CRM, Reports, Billing, Settings. Filtered by role.
- Header: branch switcher (hidden/disabled for branch-confined users), subscription banner, theme toggle, user menu.
- Subscription states: `past_due` shows a read-only banner with a Billing link; `cancelled` shows a blocking screen that still links to Billing.
- All lists need loading skeletons, empty states, and API-error states.

### POS / orders

- Desktop/tablet layout: categories and items on the left, cart on the right.
- Dine-in requires a table; takeaway/delivery do not.
- Cart line: item, quantity, notes, modifiers.
- Inline customer find-or-create by phone (`POST /customers` is idempotent and returns `created`).
- Submit generates `clientActionId`, calls `POST /orders`, redirects to the order detail.
- Order detail offers only transitions legal from the current status and permitted by role.
- Bills: prepare from a table or selected orders, then checkout; render `payment` + `qr` and poll `/api/payments/order/[orderId]`.

### KDS

- Full-screen board: `confirmed`, `preparing`, `ready` columns (and an incoming `placed` lane).
- Socket `order.status_changed` updates the board; fall back to `GET /orders/branches/:id/active` on reconnect.
- Show ticket age, items/modifiers/notes, sound toggle, and connection indicator.
- Only roles allowed by the API may open it.

### Menu

- Tabs for "Org-wide template" and "This branch".
- Explain the override model in the UI: an org-wide item is visible everywhere; a branch item overrides just that branch.
- No category edit/delete or item delete endpoints exist; category management is create-only, item management is update + availability toggle.

### Tables

- The API has no table-status or clear-table endpoint. Derive occupancy from `GET /orders/branches/:id/active` by `tableId`.
- No reservation endpoints; do not imply reservations in the UI.

### Reports

- Render the generic `{summary, tables[{columns, rows}]}` shape.
- CSV/PDF download through the authenticated BFF route.
- Default range: current month in the branch timezone.

## 9. Dependencies to add

Runtime:

- `zod` — env, form, and response validation at boundaries.
- `server-only` — guard the server API client.
- `socket.io-client` — KDS.
- `qrcode.react` — render checkout QR payloads.
- `date-fns` — report ranges and date formatting.
- `react-hook-form` + `@hookform/resolvers` — POS and payment-config forms.
- `@tanstack/react-query` — payment polling and live order cache (only where useful).
- `@tanstack/react-table` — data tables (shadcn data-table pattern).
- `sonner` — toasts (added through shadcn).
- `recharts` — Phase 4 report charts (add later).

Dev:

- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- `@playwright/test`.
- `msw` only if we need fixtures beyond the local API.

Add shadcn components as needed through the CLI so they keep the `base-nova` style: `sidebar input label field select textarea checkbox switch dialog alert-dialog sheet dropdown-menu table tabs card badge skeleton separator tooltip popover calendar sonner breadcrumb avatar alert scroll-area`.

## 10. Environment

```bash
# .env.local (gitignored)
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000   # Socket.IO only
DEFAULT_TENANT_SLUG=beanhouse
DASHBOARD_ROOT_DOMAIN=localhost
NEXT_PUBLIC_DEFAULT_CURRENCY=USD
SESSION_COOKIE_SECURE=false
```

The Nest API and `next dev` both default to port 3000. Run the dashboard on 3001 (`next dev -p 3001`) or change one of them; record the choice in `AGENTS.md` once decided.

## 11. Build phases

### Phase 0 — Foundation

Deliverables:

- Env schema, API client, `ApiError`, normalizers for auth/branches.
- `proxy.ts` tenant resolution + tests.
- Login/logout/refresh/socket-token route handlers.
- Session helpers, `requireSession`, `requireRole`, `requireBranchAccess`.
- Dashboard shell: sidebar, header, branch switcher, subscription banner, theme toggle.
- `SessionKeeper`, error boundaries, 401/402/403/429 handling.
- Money/date/timezone formatters.
- Test setup (Vitest) and a Playwright smoke test.

Acceptance:

- Owner logs in with the seeded tenant, sees a role-appropriate shell, and can log out.
- Refresh rotates tokens; expired access recovers without a full re-login.
- Unauthenticated access redirects to login; unauthorized roles see 403 screens.
- Branch-confined user sees only their branch.
- `lint`, `typecheck`, `test`, and `build` pass.

### Phase 1 — Branches, tables, menu

Deliverables:

- Branch list/create/edit/deactivate.
- Table list/create, occupancy derived from active orders.
- Menu categories/items/modifiers, org-wide vs branch, availability toggle, price editing.
- Role gating for org-wide menu writes.

Acceptance:

- Owner can configure a branch completely.
- Branch manager cannot create org-wide items and cannot touch another branch.
- Validation errors from the API render on the correct form fields.

### Phase 2 — Orders, KDS, bills, checkout

Deliverables:

- POS order builder with table selection, modifiers, notes, and idempotency key.
- Order list/detail and legal transitions.
- Bill prepare/get/checkout.
- QR display, payment polling, refund flow.
- KDS socket board with reconnect/fallback.
- Customer find-or-create inline.

Acceptance:

- A dine-in order can be created, seen on KDS, advanced to `awaiting_payment`, checked out, and settled via a provider webhook.
- A failed/duplicate submit does not create two orders.
- Refund is available only for `succeeded` payments.
- Kitchen staff cannot create or checkout orders.

### Phase 3 — Inventory, staff, CRM

Deliverables:

- Suppliers CRUD; inventory items; stock-in/adjust; movements; reorder thresholds; recipe ingredients; discrepancies.
- Shifts, roster, clock-in/out, payroll, wage rates.
- Customers, loyalty, promotions, announcements.

Acceptance:

- Each module respects its write/read role split and branch rules.
- Staff screens are blocked until the missing staff-list API is resolved.

### Phase 4 — Reports, billing, notifications, polish

Deliverables:

- Sales, inventory-consumption, staff-performance reports and CSV/PDF downloads.
- Billing subscription/plans/actions; paywall and `past_due` recovery.
- Notification dead-letter view.
- Responsive/tablet polish, a11y pass, E2E suite, CI.

## 12. Known API gaps and risks

| Gap / risk | Impact | Decision |
|---|---|---|
| No staff/user list endpoint | Cannot populate shift/wage user pickers or show names | **Backend ask:** add `GET /branches/:id/staff` or `GET /users`. Staff module is blocked until then. |
| No table status/clear/reservation endpoints | Table map can only derive occupancy from active orders | Do not promise reservations or manual clearing. |
| No menu category update/delete, no item delete | Category rename and hard delete impossible | Create-only categories; item availability is the soft-delete path. |
| No order edit/add-item endpoint | POS mistakes require cancel + recreate | Only expose legal transitions; confirm cancellation. |
| No order list pagination/date filter | History may be large and unfiltered | Request backend filters/pagination; client-side filter only for MVP. |
| Promotion apply returns totals only | No direct "attach promotion to order" endpoint | Send the resulting `discountAmount` on order creation; confirm with backend. |
| No currency endpoint | Display currency is unknown | Env default for MVP; prefer tenant payment config if it exposes currency. |
| KDS event payload undocumented | Client mapping may need adjustment | Spike against the local API before building the board. |
| Payment settlement requires a webhook | Hard to test "paid" locally | Need a provider sandbox or a documented way to trigger a webhook. |
| KDS token exposed to JS | XSS could read the short-lived token | Same-origin, `no-store`, short TTL; document the trade-off. |
| No pagination + 300/min limit | Aggressive polling can 429 | Socket for KDS; 3 s polling only during checkout. |
| CORS for Socket.IO fallback | Polling transport may be blocked | Use `transports: ["websocket"]`; add dashboard origin to API `CORS_ORIGINS` if needed. |

## 13. Testing and quality gates

- **Unit:** tenant extraction, RBAC, money/date formatting, error parsing, normalizers.
- **Component:** POS cart reducer, transition-button logic, form validation.
- **E2E (Playwright):** login/logout, branch confinement, create order, KDS transition in a second browser context, checkout pending state, role denial, `past_due` banner with a mocked 402.
- **API contract smoke:** run the real local API with the seeded tenant; assert login, `/auth/me`, branch/menu/order shapes.
- Gate: `npm run lint && npm run typecheck && npm test && npm run build`; E2E before releases.

## 14. Open items

1. ~~Seed credentials: tenant slug, owner email/password, API base URL.~~ ✅ Done: `testcafe` / `owner@testcafe.test` / `password123` on `http://localhost:3000`
2. ~~Confirm dashboard dev port (suggest 3001) so it does not collide with the API.~~ ✅ Done: `npm run dev:3001`
3. Confirm backend plans for a staff/user list endpoint.
4. Confirm how promotions should be attached to an order (send `discountAmount`?).
5. Confirm currency and default timezone per tenant/branch.
6. Confirm whether the platform super-admin dashboard is a separate app (assumed yes, out of scope).
7. Confirm a payment sandbox or webhook-simulation path for testing `paid`.
