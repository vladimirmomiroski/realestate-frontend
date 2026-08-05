<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — RealEstate Frontend Instructions

## Project and workflow

This repository is the Next.js frontend for a real-estate platform focused on North Macedonia. The separate `realestate-backend` repository owns backend behavior. Never invent endpoints or hand-maintain backend contracts; use the generated OpenAPI declarations and confirmed backend contract.

Inspect existing files before adding structure. Keep each branch to one bounded checkpoint and keep changes small, evidence-based, and within the requested product phase. Chapter 1 is complete; Chapter 2 — Public Listings Catalog Vertical Slice is next.

Before work, inspect the exact repository state:

```bash
git branch --show-current
git status --short --branch
git status --short --untracked-files=all
git diff --name-status
```

Unexpected tracked or untracked work belongs to the user until proven otherwise. Do not use broad `git reset`, `git clean`, `git checkout`, or destructive migration commands. Never use `git add .`. Do not stage, commit, merge, or push unless explicitly authorized. Ignored `docs/planning/` files are local review evidence and are never committed.

## Runtime and routing

- Use Next.js 16 App Router, React 19, TypeScript, npm, and the existing Tailwind CSS 4 pipeline.
- Canonical user-facing routes are always locale-prefixed with `/mk` or `/en`.
- `src/proxy.ts` owns locale normalization only: valid locale cookie, supported browser language, then Macedonian fallback. It performs no backend fetch or authorization.
- Root `<html>`, `<body>`, and document language belong to `src/app/[locale]/layout.tsx`.
- Treat route `params` and `searchParams` as asynchronous values under Next.js 16 conventions.
- Server Components are the default. Client Components are narrow interaction islands only.
- Do not create speculative route groups, unsupported navigation destinations, empty feature folders, or broad `index.ts` barrels.

## Ownership boundaries

- `src/app` owns routes, metadata, composition, loading/error/not-found boundaries, and layouts. Keep domain operations out of route files.
- `src/features` owns domain operations, feature models and mappings, validation, and feature UI.
- `src/components/ui` is reusable and domain-free.
- `src/components/shell` owns application chrome and calls no domain endpoint.
- `src/components/feedback` contains generic feedback presentation.
- `src/lib` contains generic infrastructure and cannot import features, components, or app code.
- `src/contracts/generated` contains generated wire declarations only.
- Features cannot import `app`, and one feature cannot deep-import another feature's internals.
- Server-only modules use `.server.ts` naming and `server-only` protection where applicable.
- Never create a barrel that mixes client and server modules.
- Use named exports except where Next.js file conventions require defaults. Prefer kebab-case filenames.

## Internationalization, metadata, and media

- Keep the custom two-locale dictionary system; do not add an external i18n framework.
- Load complete dictionaries on the server. Pass only the small translated subset required by client controls.
- Route helpers require a locale and safely preserve path parameters and query values.
- Fixed UI labels are frontend translations; backend-authored listing text remains backend content.
- Public metadata is localized and uses validated `SITE_URL` for metadata base, canonicals, and language alternatives.
- Media accepts only validated `/uploads/...` paths through the central resolver and the exact configured media origin.

## API and environment rules

- `API_BASE_URL`, `MEDIA_BASE_URL`, and `SITE_URL` are validated server/build configuration. Do not add `NEXT_PUBLIC_API_BASE_URL` or another browser-readable backend origin.
- Server Components call feature-owned server operations directly, not this application's Route Handlers.
- Future browser-originated backend operations use explicit same-origin Route Handlers. Never add a catch-all proxy.
- Use native `fetch`; do not add Axios, React Query, or another transport dependency without an approved architecture change.
- Generic transport remains server-only and feature operations remain feature-owned.
- Generated OpenAPI output is committed wire typing only and must never be hand-edited.
- Build and tests consume committed generated types. API generation and drift checking are explicit operations requiring Development Swagger.
- Never silently accept generated OpenAPI drift.
- Do not put access tokens in browser storage. Future authenticated browser calls use the locked BFF/HttpOnly-cookie boundary.

## Testing and validation

- Vitest and Testing Library own unit and synchronous component tests.
- Playwright and axe own complete Next.js/browser behavior. The current browser matrix is Chromium-only.
- `tests/e2e/**` remains excluded from Vitest discovery.
- Normal `npm run check`, builds, unit tests, and E2E tests must not contact the backend.
- Stop browser, frontend, and backend processes after verification.
- `.next`, coverage, Playwright output, and planning artifacts remain ignored and untracked.

Use the scripts in `package.json`; a final implementation validation normally includes:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run check
npm run build
npm run test:e2e
```

Use portable `npm` syntax in source-controlled files and documentation. On Windows only, `npm.cmd` may be used from a terminal when PowerShell execution policy blocks `npm.ps1`.

Do not run `npm ci` while `FE-TOOL-01` remains unresolved. Do not delete or reinstall healthy `node_modules`, run dependency upgrades without scope, or run `npm audit fix --force`.

## Product boundaries

The public anonymous journey is implemented chapter by chapter: listings catalog, complete search/filters, listing details/comparables, then public agencies and anonymous-journey hardening. Authentication, sessions, profiles, listing mutations/uploads, agency workspaces, administration, payments, chat, saved searches/favorites, maps, analytics, and AI claims remain out of scope until explicitly planned.

Preserve truthful UI: do not claim real data, capabilities, verification, valuation, market averages, scoring, or workflows that the frontend and backend do not yet provide.
