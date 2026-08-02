# Chapter 1 — Frontend Operating System and Localized Public Shell

## 1. Status

```text
Status: ready for implementation
Architecture verdict: selectively rebuild
Dependency: completed backend Chapter 12 contract
Next chapter: Chapter 2 — Public Listings Catalog Vertical Slice
```

This document is the implementation authority for Chapter 1. It converts the accepted frontend architecture into an ordered, bounded implementation plan. The implementation session must not reopen the architecture choices recorded here.

## 2. Objective

Establish the frontend operating system once and prove it through a small visible bilingual public shell.

Chapter 1 must leave the repository with:

- canonical locale-prefixed routing;
- correct document language and localized metadata;
- a responsive, accessible public shell;
- explicit semantic styling and theme ownership;
- validated environment boundaries;
- generated backend wire types;
- generic API, error, query, pagination, and media infrastructure;
- locked future session/BFF rules without prematurely implementing authentication;
- enforceable folder/import ownership;
- unit, component, browser, and accessibility test foundations;
- current project documentation;
- no stale unsupported route or API scaffold.

Chapter 1 is foundation work, but it must produce a visible result. `/` must redirect to a supported locale, and `/mk` and `/en` must render an intentional public shell with navigation into the future listings route.

## 3. User-Visible and Architectural Outcome

At completion:

```text
GET /                         -> locale-prefixed redirect, falling back to /mk
GET /mk                       -> Macedonian public shell and landing content
GET /en                       -> English public shell and landing content
document language             -> matches route locale
locale switch                 -> preserves route and query
theme                         -> System, Light, and Dark; persisted and accessible
metadata                      -> localized and based on SITE_URL
backend wire types            -> generated and committed
API failures                  -> normalized ProblemDetails with request IDs
media URLs                    -> resolved only from approved /uploads paths
tests                         -> deterministic unit/component/E2E/axe foundation
```

No real listing data is rendered in Chapter 1. The shell may link to `/{locale}/listings`, but Chapter 2 owns that route's data and product UI.

## 4. Locked Implementation Decisions

The Chapter 1 implementation session must apply these decisions rather than reconsider them:

1. Keep Next.js 16, React 19, npm, TypeScript, Tailwind CSS 4, `next-themes`, and `lucide-react`.
2. Selectively rebuild rather than preserving stale structure or starting a new project.
3. Use always-prefixed `/mk` and `/en` canonical URLs.
4. Select locale from preference cookie, then supported `Accept-Language`, then `mk`.
5. Use `src/proxy.ts` for locale normalization only; it performs no backend fetch.
6. Put the root `<html>`/`<body>` layout at `src/app/[locale]/layout.tsx` so `lang` is correct.
7. Treat route `params` and `searchParams` as asynchronous Next.js 16 values.
8. Use Server Components by default and small Client Component islands only for real interaction.
9. Keep a small custom dictionary system with server-only loading.
10. Keep Tailwind 4 and rebuild semantic CSS tokens for WCAG 2.2 AA contrast.
11. Keep `next-themes`, with a localized System/Light/Dark control.
12. Use generated OpenAPI wire types plus handwritten transport, operations, query logic, and view models.
13. Do not create a generated runtime SDK.
14. Use native `fetch`; do not add Axios.
15. Do not add TanStack Query, Redux, Zustand, an i18n framework, Auth.js, a UI kit, Storybook, or React Hook Form in Chapter 1.
16. Reserve authentication for a same-origin BFF and HttpOnly cookie; do not implement auth routes or store tokens in browser-readable storage now.
17. Make backend `API_BASE_URL` and media/site origins server/build configuration, not `NEXT_PUBLIC_*` variables.
18. Use Vitest/Testing Library for pure logic and synchronous components and Playwright for async Server Components and browser journeys.
19. Enforce dependency direction in ESLint.
20. Remove old code only after its replacement is integrated and all affected checks pass.

## 5. Scope

### 5.1 In scope

- repository-state and migration safety checks;
- runtime/dev dependency changes listed in this document;
- package scripts and test configuration;
- TypeScript and ESLint hardening;
- environment example and validation;
- precise Next Image media-origin configuration;
- locale routing and preference persistence;
- server-only dictionaries and limited client translation context;
- locale-aware route helpers;
- root locale layout, public layout, localized landing page, error, and not-found boundaries;
- font coverage for Latin and Cyrillic;
- semantic light/dark tokens and global base styles;
- theme provider and accessible System/Light/Dark control;
- public header, footer, skip link, locale switcher, and one used button primitive;
- generic API transport and error normalization;
- generated OpenAPI wire types and drift scripts;
- query serialization and internal page model;
- API-relative media URL resolution;
- testing infrastructure and Chapter 1 tests;
- removal of stale scaffolding after migration;
- README, frontend context, and agent guidance updates at implementation closeout.

### 5.2 Explicitly deferred

- listing API operations and listing data rendering;
- listing cards, grids, filters, and pagination UI;
- login, registration, logout, session cookies, and route protection;
- current-user profile and avatar;
- React Hook Form;
- browser API transport and BFF Route Handlers;
- TanStack Query or another client server-state library;
- listing creation/lifecycle/images;
- agency dashboard, invitations, members, and admin operations;
- map integration;
- saved searches, favorites, contact forms, AI features, and unsupported admin routes;
- Storybook, visual regression, and a broad component catalog.

## 6. Repository and Migration Safety

Before changing any file, run:

```powershell
git branch --show-current
git status --short --branch
git diff --name-status
```

Rules:

1. Treat actual output as authoritative; do not assume a clean branch from planning documents.
2. Inventory tracked and untracked files separately.
3. If unexpected work overlaps Chapter 1, inspect it and preserve useful behavior.
4. Add replacements before deleting old files.
5. Move consumers to the new boundary and run focused checks before removal.
6. Do not use `git clean`, `git reset --hard`, `git checkout --`, or an equivalent broad destructive command.
7. Do not stage or commit unless the user explicitly requests the Git operation.
8. End each checkpoint with `git diff --check` and a focused status review.

The earlier architecture audit reported untracked preview/UI files, while the latest read-only inspection found a clean `development` branch without them. If they reappear, they are user work: review their accessible/class patterns and migrate useful behavior before any deletion.

## 7. Dependency Changes

### 7.1 Keep

Runtime:

```text
next
react
react-dom
lucide-react
next-themes
```

Development:

```text
tailwindcss
@tailwindcss/postcss
typescript
eslint
eslint-config-next
prettier
prettier-plugin-tailwindcss
@types/node
@types/react
@types/react-dom
```

### 7.2 Add as runtime dependencies

```text
zod
clsx
tailwind-merge
class-variance-authority
server-only
```

Purposes:

- `zod`: environment and URL-boundary schemas; later reused by forms.
- `clsx` and `tailwind-merge`: one safe `cn` utility instead of repeated class joining.
- `class-variance-authority`: typed variants for the small owned primitive layer.
- `server-only`: compile/build guard for environment, dictionary, and server-transport modules.

### 7.3 Add as development dependencies

```text
openapi-typescript
vitest
@vitejs/plugin-react
vite-tsconfig-paths
jsdom
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
@vitest/coverage-v8
@playwright/test
@axe-core/playwright
```

### 7.4 Do not add

```text
msw                         # Chapter 2 owns first transport fixtures
react-hook-form             # first mutation-form phase after Chapter 5
@hookform/resolvers         # introduced with react-hook-form
@tanstack/react-query       # reconsider after Chapter 5
Axios
Redux or Zustand
Auth.js
next-intl or another i18n framework
a component/UI kit
Storybook
a toast library
a generated API SDK
```

Retain the current PostCSS override unless `npm explain postcss` and the resolved dependency tree prove that it is obsolete. Do not remove it merely to simplify `package.json`.

## 8. Package Scripts and Tooling

Update `package.json` with scripts having these exact responsibilities:

```text
dev             start Next development server
build           create production Next build
start           start production Next server
lint            lint the repository and fail on warnings
typecheck       run TypeScript without emitting output
format          write Prettier formatting
format:check    check Prettier formatting without writing
test            run Vitest once
test:watch      run Vitest in watch mode
test:coverage   run Vitest with V8 coverage
test:e2e        run Playwright
api:generate    generate committed OpenAPI TypeScript output
api:check       generate to a temporary file and fail on drift
check           format:check, lint, typecheck, and test
```

The aggregate `check` script must not contact the backend. `api:generate` and `api:check` are explicit contract operations that require Development Swagger.

Configure Playwright initially for Chromium. Browser-matrix expansion is deferred until product evidence justifies it. The implementation session may install the required Playwright Chromium binary as part of the authorized dependency setup.

## 9. File Operations

### 9.1 Root files to modify

```text
package.json
package-lock.json
tsconfig.json
eslint.config.mjs
next.config.ts
.gitignore
.prettierignore                 # only if generated/test output needs it
README.md                       # closeout, after implementation is true
AGENTS.md                       # closeout, after architecture is enforced
docs/frontend-context.md        # closeout reconciliation only
```

### 9.2 Root files to create

```text
.env.example
vitest.config.ts
playwright.config.ts
scripts/generate-api-types.mjs
scripts/check-api-types.mjs
tests/e2e/foundation.spec.ts
```

### 9.3 Source files to create

```text
src/proxy.ts

src/app/[locale]/layout.tsx
src/app/[locale]/error.tsx
src/app/[locale]/not-found.tsx
src/app/[locale]/(public)/layout.tsx
src/app/[locale]/(public)/page.tsx

src/components/providers/theme-provider.tsx
src/components/ui/button.tsx
src/components/shell/skip-link.tsx
src/components/shell/public-header.tsx
src/components/shell/public-footer.tsx
src/components/shell/locale-switcher.tsx
src/components/shell/theme-control.tsx
src/components/feedback/error-state.tsx

src/config/env.server.ts
src/config/site.ts
src/config/routes.ts

src/contracts/generated/openapi.d.ts

src/i18n/config.ts
src/i18n/get-dictionary.server.ts
src/i18n/client-context.tsx
src/i18n/dictionaries/en.ts
src/i18n/dictionaries/mk.ts
src/i18n/dictionaries/types.ts

src/lib/api/transport.server.ts
src/lib/api/problem-details.ts
src/lib/api/api-error.ts
src/lib/api/query-params.ts
src/lib/api/page.ts
src/lib/media/media-url.ts
src/lib/utils/cn.ts

src/styles/globals.css
src/styles/tokens.css

src/test/setup.ts
src/test/render.tsx
```

Co-locate focused `*.test.ts` or `*.test.tsx` files beside their subjects unless a test is a reusable integration fixture or an E2E journey.

### 9.4 Existing files to adapt or move

```text
src/app/layout.tsx
  -> replace with src/app/[locale]/layout.tsx

src/app/globals.css
  -> migrate useful reset/token concepts into src/styles/globals.css and tokens.css

src/app/(public)/page.tsx
  -> replace with localized public landing page

src/components/shared/providers/theme-provider.tsx
  -> adapt into src/components/providers/theme-provider.tsx

src/components/shared/theme/theme-toggle.tsx
  -> replace with localized System/Light/Dark theme-control.tsx

src/i18n/*
  -> adapt dictionary copy into server-loaded locale structure

src/config/site.ts
  -> replace placeholder product URL/metadata with validated site configuration

src/config/routes.ts and navigation.ts
  -> replace with locale-required helpers and implemented-route navigation

src/features/listings/utils/listing-formatters.ts
  -> retain in place for Chapter 2, making only changes required by compilation

src/features/listings/utils/listing-labels.ts
  -> retain for Chapter 2 unless new generated enum typing requires a narrow adaptation
```

### 9.5 Existing files to replace/delete after migration

```text
src/lib/api/api-client.ts
src/features/listings/services/listings-service.ts
src/features/listings/types/listing.ts
src/features/listings/types/listing-filters.ts
src/features/listings/types/paged-response.ts
obsolete root layout/page/global-style files after new imports are active
empty .gitkeep route and feature scaffolds
unsupported saved/admin-user/admin-listing route/navigation placeholders
```

The stale listing files may be removed in Chapter 1 only after generated contracts and generic transport compile. Chapter 2 creates the replacement listing operations and view models. Do not leave a stale callable listings service that appears authoritative.

### 9.6 Files not to create in Chapter 1

Do not create empty future placeholders such as:

```text
src/app/[locale]/(auth)
src/app/[locale]/(account)
src/app/[locale]/(agency-workspace)
src/app/[locale]/(admin)
src/app/api/session
src/features/auth
src/features/account
src/lib/auth
```

They appear in the long-term architecture only and are created with their first implemented behavior.

## 10. Chapter 1 Target Structure

At Chapter 1 completion, the meaningful structure should be:

```text
scripts/
  generate-api-types.mjs
  check-api-types.mjs

tests/
  e2e/foundation.spec.ts

src/
  proxy.ts
  app/
    favicon.ico
    [locale]/
      layout.tsx
      error.tsx
      not-found.tsx
      (public)/
        layout.tsx
        page.tsx
  components/
    providers/theme-provider.tsx
    ui/button.tsx
    shell/
      skip-link.tsx
      public-header.tsx
      public-footer.tsx
      locale-switcher.tsx
      theme-control.tsx
    feedback/error-state.tsx
  config/
    env.server.ts
    site.ts
    routes.ts
  contracts/generated/openapi.d.ts
  features/listings/utils/
    listing-formatters.ts
    listing-labels.ts
  i18n/
    config.ts
    get-dictionary.server.ts
    client-context.tsx
    dictionaries/
      en.ts
      mk.ts
      types.ts
  lib/
    api/
      transport.server.ts
      problem-details.ts
      api-error.ts
      query-params.ts
      page.ts
    media/media-url.ts
    utils/cn.ts
  styles/
    globals.css
    tokens.css
  test/
    setup.ts
    render.tsx

.env.example
vitest.config.ts
playwright.config.ts
```

Do not retain empty folders to make the tree resemble the long-term target.

## 11. Environment Foundation

Create `.env.example` with:

```dotenv
API_BASE_URL=http://localhost:5231
MEDIA_BASE_URL=http://localhost:5231
SITE_URL=http://localhost:3000
OPENAPI_URL=http://localhost:5231/swagger/v1/swagger.json
```

### 11.1 Runtime/build variables

```text
API_BASE_URL     absolute backend origin used only by server code
MEDIA_BASE_URL   absolute public media origin used by server rendering and next.config
SITE_URL         absolute canonical frontend origin used by metadata
```

Validation rules:

- require absolute HTTP/HTTPS URLs;
- reject credentials, query strings, fragments, and non-root paths;
- normalize trailing slashes consistently;
- allow documented localhost defaults only outside production;
- fail production startup/build when required values are missing or invalid;
- mark runtime server environment access with `server-only`;
- do not expose an API origin with `NEXT_PUBLIC_*`.

### 11.2 Tooling variable

`OPENAPI_URL` belongs to the generation scripts. It may default to the documented local Swagger JSON URL and must not be required by normal build, lint, typecheck, or tests.

### 11.3 Git ignore

Continue ignoring real `.env*` files while allowing the safe example:

```gitignore
.env*
!.env.example
```

No secrets or live tokens may appear in the example or documentation.

## 12. API and OpenAPI Foundation

### 12.1 Generated wire types

Use `openapi-typescript` against Development Swagger and commit:

```text
src/contracts/generated/openapi.d.ts
```

Rules:

- generated header states that the file must not be edited manually;
- generation is deterministic;
- the generator writes through a temporary file and replaces output only after success;
- `api:check` writes only to a temporary location and compares with the tracked output;
- normal build does not invoke generation;
- no runtime code imports a generated SDK because none is created;
- generated types represent wire data only.

### 12.2 Server transport

`transport.server.ts` must import `server-only` and expose one focused request primitive. It may accept:

```text
HTTP method
relative API path
typed query values
HeadersInit additions from trusted server code
JSON or FormData body
cache policy / Next fetch options
AbortSignal
optional backend Bearer token for future authenticated calls
```

It must:

1. resolve paths only against validated `API_BASE_URL`;
2. reject unexpected absolute endpoint URLs;
3. set `Accept: application/json` unless explicitly overridden by trusted server code;
4. set JSON `Content-Type` only for JSON bodies;
5. never manually set a multipart boundary;
6. never send `X-Request-ID`;
7. accept 200/201 JSON;
8. return `undefined` for 204/205 or a genuinely empty successful response;
9. parse JSON and `+json` media types;
10. normalize canonical ProblemDetails failures;
11. retain status and response request ID for non-JSON failures;
12. distinguish abort, network, malformed-success, and API failure categories;
13. avoid automatic retry behavior.

### 12.3 Query serialization

Supported primitive values:

```text
string
number
boolean
null
undefined
```

Required behavior:

```text
0             included
false         included
nonempty text included
null          omitted
undefined     omitted
empty string  omitted only when declared semantically empty
```

Produce deterministic key ordering so URLs and tests remain stable.

### 12.4 Page model

Create the frontend view page model:

```ts
type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
```

This is a handwritten view/integration model, not a replacement handwritten backend DTO. Chapter 2 maps the generated concrete listing page response into it.

## 13. Error Foundation

### 13.1 Wire guards

`problem-details.ts` defines safe runtime guards for:

```text
ProblemDetails
ValidationProblemDetails
errors: Record<string, string[]>
```

Do not assume every error body is valid merely because the content type is JSON.

### 13.2 Normalized failure

The normalized structure includes:

```ts
type ApiProblem = {
  status: number;
  code: string;
  title: string;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
};
```

`ApiProblemError` carries this data without turning English text into branching logic.

Request ID precedence:

```text
1. X-Request-ID response header
2. ProblemDetails traceId
3. absent
```

### 13.3 Presentation rules

- User-facing messages are selected by locale plus HTTP status/stable `code`.
- Safe backend `detail` may be placed in expandable technical information but is not a translation key.
- Request ID is labelled as a support identifier and can be copied.
- Network failures do not display a fake support ID.
- Field errors preserve JSON-facing backend keys.
- `request` is shown in the form-level summary; `file` belongs to the upload field.
- Unknown field keys remain visible in the summary.
- Chapter 1's generic error state supports retry callbacks and optional request IDs but does not implement auth-specific 401/403 behavior.

## 14. Media Foundation

`media-url.ts` resolves backend media without permitting arbitrary hosts.

Required rules:

1. Accept only a string beginning with a single `/uploads/` path prefix.
2. Reject protocol-relative input such as `//host/path`.
3. Reject absolute URLs, backslashes, credentials, and unrelated paths.
4. Resolve against validated `MEDIA_BASE_URL`.
5. Confirm the normalized result remains on the configured origin and under `/uploads/`.
6. Return `null` or a typed safe failure for absent/invalid values; do not throw during ordinary optional-image rendering.

Configure `next/image` with an exact remote pattern derived from `MEDIA_BASE_URL`:

```text
protocol: configured http or https
hostname: exact configured host
port: exact configured port
pathname: /uploads/**
```

No wildcard host and no additional media path are allowed.

Chapter 1 does not create a full image component or upload UI. Chapter 2 owns listing-image presentation. The foundation must nevertheless support an accessible neutral placeholder rather than exposing a broken URL.

## 15. Session Foundation

Chapter 1 locks the session architecture but creates no auth/session route, cookie, provider, or feature folder.

Future requirements that Chapter 1 infrastructure must not obstruct:

```text
browser -> explicit same-origin Route Handler -> feature server operation -> backend
backend access token -> HttpOnly frontend cookie
no access token in browser JSON, localStorage, or sessionStorage
```

Locked future cookie policy:

```text
production name: __Host-realestate_session
development name: realestate_session
HttpOnly: true
Secure: production only
SameSite: Lax
Path: /
Domain: omitted
expiry: derived from JWT exp
```

Additional invariants:

- registration sets no session because it returns no token;
- frontend logout deletes only its cookie and does not imply backend revocation;
- decoded JWT claims are never authoritative permissions;
- unsafe BFF routes must validate same origin;
- Proxy will remain only an optimistic redirect layer;
- protected pages and operations must call the backend;
- 401 clears/expires frontend session through an allowed mutation path; 403 does not;
- Disabled and PendingVerification behavior follows the backend contract.

Do not add placeholder session files in Chapter 1. These rules belong in documentation and generic transport boundaries until the post-Chapter-5 auth phase.

## 16. Internationalization Foundation

### 16.1 Supported locales

```ts
const locales = ["mk", "en"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "mk";
```

### 16.2 Proxy behavior

`src/proxy.ts`:

- excludes `/api`, `/_next`, metadata/static assets, and paths containing a file extension;
- passes valid prefixed routes;
- persists the prefix in a non-sensitive locale-preference cookie;
- redirects unprefixed routes using cookie, supported `Accept-Language`, then `mk`;
- preserves pathname and query;
- performs no slow I/O or backend fetch;
- exports a narrow matcher.

### 16.3 Locale root layout

`src/app/[locale]/layout.tsx`:

- is the root layout containing `<html>` and `<body>`;
- validates locale before rendering;
- sets `lang` from the route;
- loads Geist and Geist Mono with Cyrillic and Latin coverage where used;
- imports global styles;
- owns metadata defaults and providers;
- loads the server dictionary;
- passes only a small common/shell/error namespace to the client translation context;
- keeps the rest of each dictionary out of client bundles.

### 16.4 Dictionaries

Adapt useful existing copy, correcting stale or unsupported product claims. Required Chapter 1 namespaces include:

```text
common
metadata
navigation
home
theme
locale
errors
accessibility
```

Dictionary types must make missing keys a compile-time error. Do not make all keys optional.

### 16.5 Route helpers and switching

- Every user-facing route helper requires `Locale`.
- Route helpers cover only implemented/accepted routes: home, listings, listing details, and public agency profile.
- Do not include saved, general admin users/listings, dashboard, or other unsupported placeholders.
- Locale switcher produces a normal link to the equivalent locale-prefixed path.
- Proxy persists the selected prefix when that link is followed.
- Preserve normalized query parameters.

## 17. Styling and Theme Foundation

### 17.1 Global styles

`src/styles/globals.css` owns:

- Tailwind import;
- dark class variant;
- box sizing and document/body base rules;
- font application;
- accessible focus baseline;
- selection styling;
- reduced-motion handling;
- no component- or feature-specific styling.

`src/styles/tokens.css` owns light/dark semantic variables.

Required token categories:

```text
background / foreground
surface / on-surface
surface-muted / on-surface-muted
border / input / focus-ring
primary / on-primary
accent / on-accent
destructive / on-destructive
success / on-success
warning / on-warning
disabled / on-disabled
skeleton
radius and elevation primitives
```

Validate color pairs rather than assuming white text works on every status color. Information must never rely on color alone.

### 17.2 `cn` and variants

`src/lib/utils/cn.ts` combines `clsx` with `tailwind-merge`.

The Chapter 1 button uses CVA for only the variants and sizes actually needed by the shell. Do not create speculative badge, card, input, select, dialog, toast, or data-table primitives.

### 17.3 Theme

- Keep class-based `next-themes`.
- Initial preference is System.
- Keep `enableSystem` and hydration-safe document handling.
- Expose System, Light, and Dark, not a binary toggle that discards System.
- Accessible names and visible labels come from the current locale.
- Keyboard behavior and `aria` state are tested.
- Avoid blanket transitions and respect reduced motion.

### 17.4 Public shell

The public layout contains:

```text
skip link
header landmark
localized product/home link
implemented-route navigation
locale switcher
theme control
main landmark
footer landmark
```

The landing page must be modest and truthful. It may describe property discovery, structured filters, and price per square metre. It must not claim AI valuation, market averages, "good deal" scoring, saved items, or other unsupported functionality.

## 18. Testing Foundation

### 18.1 Vitest

Configure:

- jsdom environment for component tests;
- React plugin;
- TypeScript path resolution;
- global setup from `src/test/setup.ts`;
- Testing Library cleanup and jest-dom assertions;
- coverage for project source while excluding generated types and Next file-convention wrappers where appropriate.

Do not set an arbitrary global coverage threshold in Chapter 1. Every critical boundary listed below must have direct tests.

### 18.2 Required unit tests

Locale:

- supported-locale guard;
- cookie/Accept-Language/default selection;
- route prefixing and query preservation;
- invalid-locale behavior.

Environment:

- valid development values;
- production missing-value failure;
- invalid scheme/path/query/fragment/credentials rejection;
- consistent trailing-slash normalization.

Query serializer:

- preserves zero and false;
- omits null/undefined;
- deterministic key order;
- operation-defined empty-string handling.

API/errors:

- 200/201 JSON;
- 204/205 and empty success;
- `application/json` and `application/problem+json`/`+json`;
- validation errors;
- request header ID takes precedence over body trace ID;
- non-JSON failure;
- malformed success body;
- network and abort classification.

Media:

- valid `/uploads/...` resolution;
- invalid absolute/protocol-relative/unrelated paths;
- path-normalization safety;
- configured origin/port preservation.

Components:

- button type/disabled/focus semantics;
- System/Light/Dark theme control keyboard and accessible state;
- locale switcher accessible name and query preservation;
- generic error state with and without request ID.

### 18.3 Playwright

Chapter 1 E2E covers:

1. `/` redirects to the selected locale and falls back to `/mk`.
2. `/mk` and `/en` render successfully.
3. `html[lang]` matches the URL.
4. Locale switching preserves route/query and persists preference.
5. Theme can be selected using keyboard only and persists after reload.
6. Skip link reaches the main landmark.
7. Header, main, and footer landmarks are present.
8. Page title, description, canonical, and language alternatives are correct.
9. Narrow viewport has no unintended horizontal overflow.
10. Axe reports no serious or critical violations on representative light/dark pages.

Async Server Components are tested through Playwright. Do not create shallow Vitest tests that pretend to cover their full Next.js behavior.

### 18.4 Manual accessibility verification

Required before completion:

- complete keyboard-only navigation;
- visible focus on every interactive control;
- 200% zoom and narrow reflow;
- token contrast review in light and dark themes;
- reduced-motion behavior;
- accessible names for icon controls;
- screen-reader-friendly landmark and heading order;
- touch targets meeting WCAG 2.2 minimums, with a larger practical mobile target where possible.

## 19. TypeScript, Linting, and Import Boundaries

Set:

```text
allowJs: false
strict: true
noUncheckedIndexedAccess: true
skipLibCheck: true
noEmit: true
```

Keep the existing `@/*` path alias.

ESLint restrictions must enforce:

- `src/lib/**` cannot import `src/features/**`, `src/components/**`, or `src/app/**`;
- `src/components/ui/**` cannot import features or app;
- features cannot import app;
- a feature cannot deep-import another feature's internal folders;
- server modules use a `.server.ts` suffix and import `server-only` where applicable;
- client and server modules are not re-exported from one mixed barrel;
- lint warnings fail the command.

Use named exports except for Next.js file-convention defaults. Prefer kebab-case files. Avoid broad `index.ts` barrels.

## 20. Ordered Implementation Checkpoints

Implement in this order. Do not combine deletion with an unverified replacement.

### Checkpoint 1A — Safety, dependencies, and scripts

Scope:

- verify Git state;
- install only Chapter 1 dependencies;
- update package scripts;
- add Vitest and Playwright configuration;
- add non-writing `typecheck`/`check` commands.

Focused verification:

```text
npm install completes with expected lockfile-only dependency changes
npm run format:check
npm run lint
npm run typecheck
empty/foundation Vitest and Playwright configs load successfully
git diff --check
```

### Checkpoint 1B — Environment and media configuration

Scope:

- add `.env.example` and Git-ignore exception;
- implement validated server/build environment access;
- configure exact Next Image remote pattern;
- implement and test media URL resolver.

Focused verification:

```text
environment tests pass
media tests pass
production-invalid configuration fails safely
no NEXT_PUBLIC_API_BASE_URL exists
git diff --check
```

### Checkpoint 1C — Locale router and dictionary boundary

Scope:

- implement locale config and server dictionary loader;
- add client common-namespace context;
- implement `src/proxy.ts`;
- add locale route helpers;
- create locale root layout with correct fonts/document language.

Focused verification:

```text
locale/route tests pass
/ redirects correctly
/mk and /en render
html lang is correct
query is preserved
client boundary does not import full dictionaries
git diff --check
```

### Checkpoint 1D — Styling, theme, and public shell

Scope:

- create global/token styles;
- implement `cn`, used button, provider, theme control, locale switcher, shell, boundaries, and landing page;
- remove unsupported homepage claims.

Focused verification:

```text
component tests pass
keyboard theme and locale controls work
manual contrast/focus review passes
responsive shell has no unintended overflow
git diff --check
```

### Checkpoint 1E — OpenAPI, API, query, page, and error foundation

Scope:

- add OpenAPI generation/check scripts;
- generate committed wire types from actual Development Swagger;
- implement generic server transport;
- implement ProblemDetails guards/errors;
- implement deterministic query serializer and `Page<T>`.

Focused verification:

```text
API/query/error tests pass
api:generate succeeds
api:check is clean
normal build/test does not require backend
generated output contains no manual domain/query logic
git diff --check
```

### Checkpoint 1F — Migration and obsolete scaffold removal

Scope:

- switch all imports and routing to final Chapter 1 boundaries;
- retain/adapt useful formatters;
- remove stale API/listing wire/service files after replacement compiles;
- remove empty `.gitkeep` scaffold and unsupported routes/navigation;
- remove superseded root/demo/theme/i18n files only after new equivalents work.

Focused verification:

```text
rg confirms no imports of removed paths
no empty speculative feature/route tree remains
typecheck, lint, test, and build pass
Git status contains no unexplained deletion or untracked file
git diff --check
```

### Checkpoint 1G — Browser/accessibility verification

Scope:

- complete foundation E2E tests;
- run axe smoke checks;
- complete manual keyboard/zoom/reflow/contrast/reduced-motion review.

Focused verification:

```text
Playwright passes
no serious/critical axe violations
manual checklist passes in both locales and themes
git diff --check
```

### Checkpoint 1H — Documentation and closeout

Scope:

- replace README setup instructions;
- update `AGENTS.md` with implemented boundaries;
- reconcile `docs/frontend-context.md` with actual implementation;
- mark this chapter complete only if every gate passes;
- record any evidence-based deviation explicitly.

Focused verification:

```text
documentation agrees with actual files/scripts
no stale backend/listing-limit/filter claims remain
all final gates pass
final status/diff review is precise
```

## 21. Verification Commands

During implementation, use focused tests after each checkpoint. Before completion run:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run api:generate
npm run api:check
git status --short --untracked-files=all
git diff --check
git diff --stat
```

`api:generate` and `api:check` require the backend Development Swagger document to be available. Run generation first, review its exact diff, then run the non-writing drift check. No committed secret, password, live token, upload, build output, or test artifact is allowed.

If the implementation environment cannot launch Playwright or Development Swagger, do not declare the chapter complete. Report the exact blocked gate and leave the chapter status as incomplete.

## 22. Acceptance Criteria

### Routing and i18n

- `/` redirects using cookie, supported browser language, then `mk` fallback.
- `/mk` and `/en` are canonical, directly loadable routes.
- Locale switching preserves the current path and query.
- `<html lang>` matches the route.
- Invalid locale paths use the intended not-found behavior.
- Full dictionaries remain server-only; client components receive limited translated data.
- Cyrillic text uses an available font subset.

### Shell and theme

- Public shell contains skip link, header, navigation, main, and footer landmarks.
- Navigation advertises only implemented/accepted public destinations.
- Theme supports System, Light, and Dark and persists across reloads.
- All controls have localized accessible names.
- Light/dark token pairs meet WCAG AA contrast.
- Keyboard, reduced-motion, zoom, and mobile-reflow checks pass.
- Landing copy contains no unsupported capability claims.

### Environment and security boundaries

- Server/build origins are validated and production fails closed.
- `.env.example` is tracked; real environment files remain ignored.
- No API base URL is exposed with `NEXT_PUBLIC_*`.
- Server environment and transport modules are protected with `server-only`.
- Next Image accepts only the configured media origin and `/uploads/**`.
- No auth/session placeholder implementation stores or exposes a token.

### API and contracts

- Generated OpenAPI types match the current Development document.
- Generated files contain wire types only and are never hand-edited.
- Normal build/test succeeds without a running backend.
- Transport handles JSON, 201, 204/bodyless success, `+json`, canonical errors, malformed responses, aborts, and network failures.
- Query serialization preserves `0` and `false`.
- Request ID precedence is tested.
- English backend detail is not used as branching logic.
- Media path validation prevents arbitrary hosts.

### Architecture and migration

- App Router files are thin route/layout composition.
- Generic infrastructure imports no feature or app code.
- No mixed server/client barrel exists.
- No stale callable API client or stale listing DTO remains authoritative.
- No empty speculative route/feature scaffolding remains.
- Existing useful dictionary/formatter/theme/token behavior was migrated rather than blindly discarded.
- No unexpected user file was deleted or overwritten.

### Tests and documentation

- Format, lint, typecheck, unit/component, build, E2E, axe, generation, and drift checks pass.
- README, `AGENTS.md`, frontend context, and actual structure agree.
- Git status contains only intended Chapter 1 changes.

## 23. Non-Goals

Chapter 1 is not complete merely because it creates many folders or primitives. It must not expand into:

```text
public listing API calls or listing UI
advanced filters
listing details or comparables
public agency pages
authentication or session cookies
profile/avatar
protected routes
React Hook Form
TanStack Query
listing creation/lifecycle/images
agency workspace or admin
maps
saved searches/favorites
contact workflows without a backend contract
AI/valuation/market-average claims
Storybook or visual regression
a broad design-system buildout
backend changes
```

## 24. Completion Gate

Chapter 1 is complete only when all of the following are true:

1. Checkpoints 1A–1H are implemented in order and their focused checks pass.
2. `/`, `/mk`, and `/en` satisfy the routing and document-language contract.
3. The public shell is responsive, keyboard-operable, localized, and truthful.
4. Theme, tokens, focus, contrast, reduced motion, zoom, and reflow satisfy the accessibility gate.
5. Environment configuration fails closed in production and leaks no server-only API configuration.
6. OpenAPI wire types are generated, committed, and drift-clean.
7. API error/request-ID/query/media behavior has direct automated coverage.
8. Normal build and tests do not require a running backend.
9. All final verification commands pass, including Playwright and explicit OpenAPI checks.
10. Obsolete scaffold is removed only after safe migration; no user work is lost.
11. README, `AGENTS.md`, frontend context, and this chapter reflect the implemented result.
12. Final Git status and diff contain only intended Chapter 1 work.

Do not mark the chapter complete if a required browser, accessibility, build, or OpenAPI gate was skipped.

## 25. Chapter 2 Handoff

After Chapter 1 completion, the next Codex session should plan and implement only:

```text
Chapter 2 — Public Listings Catalog Vertical Slice
```

It may rely on these completed Chapter 1 guarantees:

```text
locale-prefixed routing and dictionaries
localized public shell
semantic styling and theme
validated API/media/site origins
generated OpenAPI wire types
generic server transport
canonical API errors and request IDs
deterministic query serializer
Page<T> view model
safe media URL resolution
Vitest/Testing Library/Playwright/axe foundations
enforced ownership/import boundaries
```

Chapter 2 should add the first feature-owned listing server operation, listing-card view model, basic search schema, cards/grid/pagination, deterministic API fixtures, and real-backend smoke tests. It must not reopen the Chapter 1 architecture or introduce client query/global state for a server-rendered catalog.
