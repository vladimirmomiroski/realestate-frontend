# RealEstate Frontend

The public frontend for a real-estate platform focused on North Macedonia. Chapter 1 and Chapter 2 implementation through 2P, followed by accepted 2S correctness hardening, are integrated. Checkpoint 2Q reconciles documentation and final verification; independent closeout approval is still required. The landing page remains data-free; `/mk/listings` and `/en/listings` render the public catalog. Authentication, saved searches, maps, dashboards, AI features, and agency workspaces are not implemented.

## Current foundation

- Next.js 16 App Router and React 19, with Server Components by default.
- Canonical Macedonian (`/mk`) and English (`/en`) routes. Unprefixed requests are normalized by locale cookie, supported browser language, then Macedonian fallback.
- Server-loaded typed dictionaries with only a narrow translated subset passed to interactive client controls.
- Localized metadata, canonical URLs, and language alternatives based on validated site configuration.
- Semantic light/dark tokens, System/Light/Dark theme persistence, keyboard-accessible shell controls, and browser/axe coverage.
- Server-only environment, media, API transport, ProblemDetails, query, pagination, and generated OpenAPI wire-type foundations.

## Public listings catalog

- Anonymous server-only `GET /api/listings`, route-owned `lang`, fixed page size 20, `cache: "no-store"`, and backend-default newest order.
- Native GET keyword search and Sale/Rent, Apartment/House filters; normalized shareable URLs, restored controls, and Previous/Next navigation. Unfiltered cards support Apartment, House, Commercial, and Land.
- Strict response adaptation, backend total counts, actual content-language annotations, deduplicated locations, and responsive one/two/three-column cards.
- Safe primary media with a stable 4:3 frame and localized missing/rejected/runtime-failure fallback; production image security does not allow loopback optimization.
- Distinct invalid-search, empty, out-of-range, and classified failure states; current-URL retry and genuine request-ID copying with concurrency protection.
- Localized metadata: clean catalog documents are `index,follow`; every query-bearing document is `noindex,follow`, with clean locale-specific canonical and language alternatives.
- Progressive enhancement uses `useFormStatus`/`useLinkStatus` pending feedback, not a route loading skeleton. Catalog-only `prefetch={false}` preserves enhanced navigation while avoiding a reproduced Next.js metadata-lifecycle failure.

Backend API transport configuration stays server-only. Resolved public media resource URLs may appear in image markup. Catalog metadata performs no listing retrieval.

## Prerequisites

- Node.js 20.9 or later (the installed Next.js package requirement).
- npm and the committed `package-lock.json`.
- Chromium for the Playwright suite.
- The sibling backend for live catalog data or explicit OpenAPI generation/drift checks. Normal verification uses a test-owned HTTP fixture.

Install dependencies with the supported npm workflow:

```bash
npm install
```

Do not use `npm ci` while `FE-TOOL-01` remains open in the frontend quality handoff. On Windows, use `npm.cmd` in a terminal where PowerShell execution policy blocks `npm.ps1`; repository commands and configuration remain portable `npm` commands.

## Environment

Copy `.env.example` to an ignored `.env.local`, then adjust values for the local environment:

```dotenv
API_BASE_URL=http://localhost:5231
MEDIA_BASE_URL=http://localhost:5231
SITE_URL=http://localhost:3000
OPENAPI_URL=http://localhost:5231/swagger/v1/swagger.json
```

- `API_BASE_URL` is the validated, server-only backend origin used by server transport.
- `MEDIA_BASE_URL` is the validated server/build origin used only with approved `/uploads/...` media paths.
- `SITE_URL` is the validated server/build origin for metadata, canonicals, and language alternatives.
- `OPENAPI_URL` is tooling-only. It is not required by the normal runtime, build, lint, typecheck, or test paths.

These origins must never be exposed through `NEXT_PUBLIC_*`. Production requires valid explicit values; documented localhost defaults apply only outside production.

## Commands

```bash
npm run dev             # development server
npm run build           # production build
npm run start           # serve a production build
npm run format          # write Prettier formatting
npm run format:check    # check formatting
npm run lint            # ESLint, zero warnings allowed
npm run typecheck       # TypeScript without emitting files
npm run test            # Vitest unit/component suite
npm run test:watch      # Vitest watch mode
npm run test:coverage   # Vitest coverage report
npm run test:e2e        # Chromium Playwright and axe suite
npm run check           # format, lint, typecheck, and Vitest
npm run api:generate    # regenerate committed OpenAPI declarations
npm run api:check       # fail if committed declarations drift
```

Normal build, unit tests, aggregate checks, and E2E tests do not require a running backend. `api:generate` and `api:check` require the backend's Development Swagger document at `OPENAPI_URL`.

If Chromium is absent, install only the existing Playwright browser dependency:

```bash
npx playwright install chromium
```

Generated declarations live in `src/contracts/generated/openapi.d.ts`. They are committed wire types, contain no runtime SDK, and must never be edited manually.

## Ownership overview

```text
scripts/                 explicit OpenAPI generation and drift tooling
src/app/                 localized routes, layouts, metadata, and boundaries
src/components/ui/       reusable domain-free primitives
src/components/shell/    public application chrome
src/components/feedback/ generic feedback UI
src/config/              validated environment, routes, navigation, and site config
src/contracts/generated/ generated backend wire declarations only
src/features/            feature-owned domain code (Chapter 2 onward)
src/i18n/                locale selection and server/client dictionary boundaries
src/lib/                 generic server and shared infrastructure
src/styles/              global baseline and semantic tokens
tests/e2e/               real-browser Playwright and axe verification
```

See [frontend context](docs/frontend-context.md) for durable architecture, the [Chapter 1 record](docs/chapters/chapter-1-frontend-foundation.md), and the [Chapter 2 reconciliation](docs/chapters/chapter-2-public-listings-catalog.md#15-closeout-reconciliation-and-verification) for accepted deviations, verification scope, and current limitations. The [quality handoff](docs/frontend-quality-handoff.md) tracks unresolved work. Broader design and Chapter 3 features remain deferred; this closeout does not start them.
