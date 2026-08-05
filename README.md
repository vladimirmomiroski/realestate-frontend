# RealEstate Frontend

The public frontend for a real-estate platform focused on North Macedonia. Chapter 1 is complete: the repository now provides the localized, accessible operating foundation for the public product. Chapter 2 will add the first backend-backed listings catalog; the current landing page does not render real listing data or implement authentication, saved searches, maps, dashboards, AI features, or agency workspaces.

## Current foundation

- Next.js 16 App Router and React 19, with Server Components by default.
- Canonical Macedonian (`/mk`) and English (`/en`) routes. Unprefixed requests are normalized by locale cookie, supported browser language, then Macedonian fallback.
- Server-loaded typed dictionaries with only a narrow translated subset passed to interactive client controls.
- Localized metadata, canonical URLs, and language alternatives based on validated site configuration.
- Semantic light/dark tokens, System/Light/Dark theme persistence, keyboard-accessible shell controls, and browser/axe coverage.
- Server-only environment, media, API transport, ProblemDetails, query, pagination, and generated OpenAPI wire-type foundations.

## Prerequisites

- Node.js 20.9 or later (the installed Next.js package requirement).
- npm and the committed `package-lock.json`.
- Chromium for the Playwright suite.
- The sibling backend only when generating or checking OpenAPI types.

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

See `docs/frontend-context.md` for durable architecture and `docs/chapters/chapter-1-frontend-foundation.md` for the completed Chapter 1 record. `docs/frontend-quality-handoff.md` is the live register of verified unresolved frontend issues. Chapter 2 — Public Listings Catalog Vertical Slice is the next product chapter.
