<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tenant dashboard

Next.js 16 App Router starter: React 19, strict TypeScript, Tailwind CSS v4, shadcn/ui.

## Before writing code

- Read the bundled Next.js 16 docs at `node_modules/next/dist/docs/`. This version differs from older Next: Turbopack is the default bundler, request APIs (`params`, `searchParams`, `cookies()`, `headers()`) are async, `middleware` is replaced by `proxy`, and `next lint` is removed. Start with `01-app/02-guides/upgrading/version-16.md`.
- Leave the `nextjs-agent-rules` block above intact — `next dev` regenerates it. Commit it with your changes to keep the tree clean.

## Commands

```bash
npm run dev        # next dev on :3000 (collides with the API)
npm run dev:3001   # use this when the Nest API is on :3000
npm run build
npm run lint       # runs eslint directly, not `next lint`
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run format     # prettier over **/*.{ts,tsx}
```

There is no E2E suite yet. Verify changes with `npm run lint && npm run typecheck && npm test && npm run build`.

## Product and API docs

- `docs/build-plan.md` — architecture, route map, phases, and known API gaps.
- `docs/curl.md` — the API reference; it is the source of truth for routes, roles, and branch scope.
- `docs/server.md` — functional requirements and system design.
- `proxy.ts` resolves tenant subdomains and sets `x-tenant-slug`; do not add a second middleware/proxy.
- `lib/api/client.ts` is server-only and must attach both `Authorization` and `X-Tenant-Id`.
- Auth tokens live in `httpOnly` cookies; never put them in `localStorage` or pass them to client components.

## Layout

- `app/` — App Router routes. `app/layout.tsx` loads fonts and wraps the app in `ThemeProvider`; `app/globals.css` holds the Tailwind v4 theme tokens.
- `components/ui/` — shadcn-generated components. `components/theme-provider.tsx` implements dark mode (class strategy, `d` hotkey).
- `lib/utils.ts` — re-exports `cn`; `hooks/` is for shared hooks.
- `@/*` maps to the repo root: use `@/components/...`, `@/lib/utils`, `@/hooks/...`.

## UI conventions

- shadcn style is `base-nova`, built on **`@base-ui/react` primitives — not Radix**. Add components with `npx shadcn@latest add <component>`; don't assume Radix APIs or hand-write equivalents.
- Icons come from **Phosphor** (`@phosphor-icons/react`), not lucide.
- `cn` is the standalone `cn` package (a compiled clsx + tailwind-merge replacement). Generated UI components import it as `import { cn } from "cn"`; `@/lib/utils` re-exports the same function. Match the surrounding file.
- Tailwind is v4 CSS-first: there is no `tailwind.config.*`; theme variables live in `app/globals.css` and it imports `shadcn/tailwind.css`.
- Prettier uses no semicolons, double quotes, 80 columns, and Tailwind class sorting (`cn`/`cva` recognized). Run `npm run format` before finishing.

## Notes

- `CLAUDE.md` just imports `AGENTS.md`; keep this file as the single source of instruction truth.
- `.env*` is gitignored; use standard Next.js env loading.
