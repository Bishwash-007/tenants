# Tenant dashboard

Next.js 16 admin/POS dashboard for Bliss Cafe tenants (owners, managers, and
staff). It talks to the NestJS API through a server-side BFF; browser requests
never carry API tokens.

## Docs

- `docs/curl.md` — complete API reference (routes, roles, branch scope, errors).
- `docs/server.md` — functional requirements and system design.
- `docs/build-plan.md` — dashboard architecture, route map, phases, and known
  API gaps.

## Development

The API defaults to `http://localhost:3000`. Run the dashboard on 3001:

```bash
cp .env.example .env.local
npm install
npm run dev:3001
```

Set `DEFAULT_TENANT_SLUG` to a seeded tenant, or open
`http://beanhouse.localhost:3001` / enter the workspace slug on the login form.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run format` runs Prettier with Tailwind class sorting.

## Architecture notes

- `proxy.ts` resolves the tenant subdomain and sets `x-tenant-slug`.
- Route handlers under `app/api/auth/*` own login/logout/refresh and set
  `httpOnly` cookies.
- `lib/api/client.ts` is server-only and attaches `Authorization` and
  `X-Tenant-Id` to every API request.
- Authenticated reads happen in server components; mutations will use server
  actions in later phases.
- `lib/auth/rbac.ts` is the single UI capability map; the API remains the final
  authority.
