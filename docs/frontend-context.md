# RealEstate Frontend Context

## 1. Purpose

This is the authoritative living handoff for the RealEstate frontend. It records the accepted frontend architecture, current implementation phase, integration rules, dependency policy, migration direction, and near-term roadmap.

Use this document for durable project context. Use `docs/chapters/*.md` for implementation-ready chapter specifications. When implementation changes a lasting rule, update this document at chapter closeout so it continues to describe the actual system rather than its history.

The completed backend contracts are authoritative for API behavior. Stale frontend or shared-product documents must not override the current backend context, Chapter 12 contract, or generated OpenAPI document.

## 2. Current Status

```text
Backend: complete through Chapter 12 and ready for frontend integration
Frontend verdict: selectively rebuild
Current frontend milestone: Chapter 1 ready for implementation
Current detailed chapter: docs/chapters/chapter-1-frontend-foundation.md
Next product phase: localized public discovery
```

The frontend contains a valid Next.js/npm/TypeScript foundation and several reusable ideas, but it does not contain a reliable product architecture yet. Existing routes, API types, API transport, navigation, metadata, locale boundary, and placeholder feature structure reflect an earlier and smaller backend contract.

The accepted approach is therefore:

- keep sound tooling and narrowly useful code;
- adapt dictionaries, formatters, semantic-token ideas, and theme support;
- replace stale API, routing, environment, metadata, and product UI foundations;
- remove obsolete or speculative scaffold only after replacements are working;
- avoid a rewrite whose only purpose is making the code different.

Every implementation session must begin with:

```powershell
git branch --show-current
git status --short --branch
git diff --name-status
```

The working tree, including untracked files, is always authoritative. Never discard unexpected work with clean, reset, checkout, or an equivalent broad operation.

## 3. Product Boundary for Chapters 1–5

The first frontend phase is the anonymous public journey:

```text
localized public shell
  -> public listings catalog
  -> complete search and filters
  -> listing details and comparables
  -> public agency pages and anonymous-journey hardening
```

Authentication, profile/avatar management, listing creation, listing lifecycle mutations, listing-image management, agency workspace, and platform administration are deliberately deferred until the next Ultra planning session after Chapter 5.

Do not introduce unsupported saved searches, favorites, general admin user/listing pages, contact forms without a backend contract, AI valuation, or other speculative product surfaces during Chapters 1–5.

## 4. Locked Architecture

### 4.1 Runtime and routing

- Keep Next.js App Router and deploy with a Next.js server runtime. Static export is not supported by the accepted architecture.
- Canonical user-facing URLs are always locale-prefixed with `/mk` or `/en`.
- Locale selection order for an unprefixed URL is: valid locale cookie, supported `Accept-Language`, then `mk`.
- `src/proxy.ts` performs locale normalization. In a later authenticated phase it may perform optimistic session-cookie presence/expiry redirects, but it must not fetch the backend or make authoritative permission decisions.
- Route groups represent real layout or security boundaries, not speculative future features.
- Next.js route `params` and `searchParams` are treated as asynchronous values in accordance with Next.js 16 conventions.

### 4.2 Server and client components

- Server Components are the default.
- Pages, localized metadata, public listing reads, listing details, comparables, and public agency reads execute on the server.
- Client Components are leaf islands for real browser interaction such as theme and locale controls, filter drafts/dialogs, galleries, forms, upload previews, and mutations.
- Server Components call the backend through feature-owned server modules. They never call this Next.js application's own Route Handlers.
- Client Components call explicit same-origin Route Handlers when a browser-originated backend operation is required.
- A catch-all backend proxy is prohibited.

### 4.3 State boundaries

```text
URL state       public filters, sort, page, and page size
Server state    backend resources and authenticated current-user state
Form state      submitted data, validation, and field interaction
Local state     open/closed controls, gallery selection, temporary UI drafts
Theme state     next-themes provider
Global state    none unless future evidence establishes a need
```

- Public search state belongs to the URL; do not duplicate it in a global store.
- Do not add Redux or Zustand.
- Do not add TanStack Query during Chapters 1–5. Re-evaluate it for authenticated, mutation-heavy screens after Chapter 5.
- Public backend reads use explicit `cache: "no-store"` through Chapter 5. Do not rely on framework defaults.

### 4.4 Styling, components, and theme

- Keep Tailwind CSS 4 and the CSS-first PostCSS pipeline.
- Use accessible semantic CSS custom properties for background/surface, foreground/on-surface, primary/on-primary, destructive/on-destructive, success/on-success, warning/on-warning, borders, focus, disabled, and skeleton states.
- Feature code consumes semantic tokens rather than arbitrary brand hex colors.
- Shared UI primitives remain domain-free and are created only when used.
- Use native semantic controls first. Do not add a monolithic UI kit.
- Keep `next-themes` with class-based dark mode and System/Light/Dark choices.
- Theme persistence and hydration belong to the theme provider; theme text and accessible names are localized.
- WCAG 2.2 AA, visible focus, sufficient contrast, keyboard operation, and reduced-motion behavior are chapter completion requirements.

### 4.5 Internationalization

- Keep a small custom two-locale system rather than adding an i18n framework.
- Load dictionaries through a server-only loader. Do not synchronously import both complete dictionaries into client code.
- Client islands receive only the translated strings or small namespaces they require.
- Route helpers require a locale and never silently produce unprefixed links.
- Locale switching preserves route shape and query parameters.
- The route locale is sent to listing endpoints as backend `lang`.
- If backend-authored listing content falls back to another `languageCode`, mark that content with its actual language while keeping the document language equal to the requested route locale.
- Fixed application labels are frontend translations; backend-authored listing text remains backend content.

### 4.6 SEO

- `SITE_URL` owns `metadataBase`; localhost is never a production default.
- Public pages generate localized titles, descriptions, canonical URLs, and language alternatives.
- The clean listings catalog and Active listing-detail pages are indexable.
- Filtered, sorted, or paginated listings URLs use `noindex,follow` and a normalized catalog canonical to prevent crawl explosion.
- Public agency pages are rendered according to the backend contract, but only Active agencies are indexable. The frontend must not present another agency state as verified.
- Initial sitemap output contains stable public routes. Do not crawl every listing or agency at build time without a bounded discovery/feed contract.

## 5. Target Folder Structure and Ownership

The long-term structure is shown below. Later route groups and features must not be created as empty placeholders.

```text
scripts/
  generate-api-types.mjs
  check-api-types.mjs

tests/
  e2e/
  fixtures/

src/
  proxy.ts

  app/
    favicon.ico
    robots.ts
    sitemap.ts
    api/                         # explicit same-origin BFF endpoints
      session/                   # later
      account/                   # later
      listings/                  # later mutations/uploads
    [locale]/
      layout.tsx
      error.tsx
      not-found.tsx
      (public)/
        layout.tsx
        page.tsx
        listings/
          page.tsx
          loading.tsx
          [listingId]/page.tsx
        agencies/[slug]/page.tsx
      (auth)/                    # later, created with first route
      (account)/                 # later, created with first route
      (agency-workspace)/        # later, created with first route
      (admin)/                   # later, created with first route

  components/
    ui/                          # domain-free primitives
    shell/                       # header, footer, navigation, skip link
    feedback/                    # generic error, empty, and status UI
    providers/                   # minimal client providers

  config/
    env.server.ts
    site.ts
    routes.ts

  contracts/
    generated/openapi.d.ts       # generated wire types only

  features/
    listings/
      api/
      components/
      model/
      search/
      public.ts                  # explicit public boundary where needed
    agencies/
      api/
      components/
      model/
    auth/                        # later
    account/                     # later
    listing-management/          # later
    agency-workspace/            # later

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
      transport.browser.ts       # later, same-origin BFF only
      problem-details.ts
      api-error.ts
      query-params.ts
      page.ts
    auth/                        # later
      session-cookie.server.ts
      current-user.server.ts
      same-origin.server.ts
    media/media-url.ts
    utils/cn.ts

  styles/
    globals.css
    tokens.css

  test/
    setup.ts
    render.tsx
    fixtures/
```

Ownership rules:

- `app` owns routing, metadata, route boundaries, and composition only.
- `components/ui` cannot import features.
- `components/shell` and `components/feedback` cannot call domain endpoints.
- A feature owns its endpoint operations, mappings, view models, and feature UI.
- `lib` is generic infrastructure and cannot import features, shared components, or `app`.
- `contracts/generated` contains generated HTTP wire types only.
- Cross-feature composition happens in `app` or through a deliberately named public boundary.
- Avoid catch-all barrel files, especially barrels that mix client and server modules.
- Prefer relative imports inside one feature and the `@/` alias across top-level ownership boundaries.
- Use kebab-case filenames and named exports except where Next.js requires a default export.

## 6. Frontend-to-Backend Integration Rules

### 6.1 Transport split

```text
Server Component
  -> feature-owned *.server.ts operation
  -> generic server transport
  -> ASP.NET backend

Client Component
  -> explicit same-origin Next Route Handler
  -> feature-owned *.server.ts operation
  -> generic server transport
  -> ASP.NET backend
```

Generic transport owns HTTP mechanics only. Listing, agency, user, auth, and admin endpoint paths belong to their features.

### 6.2 OpenAPI and types

- Generate and commit TypeScript wire types from Development Swagger with `openapi-typescript`.
- Generated output lives in `src/contracts/generated/openapi.d.ts` and is never hand-edited.
- Normal builds use the committed output and do not require a running backend.
- `api:generate` refreshes the output; `api:check` regenerates to a temporary location and fails on drift.
- Do not generate a runtime SDK, React hooks, query keys, mappers, or UI models.
- Feature operations use generated request/response types and handwritten query schemas, serializers, operations, and view-model adapters.

### 6.3 Success and failure handling

The generic transport must support:

```text
200/201 JSON success
204/205 or empty success
application/json
application/problem+json and application/*+json
multipart request bodies without manually setting the boundary
AbortSignal propagation
non-JSON failure bodies
malformed expected JSON
network failures distinct from API failures
```

Canonical normalized API failure fields are:

```text
status
code
title
optional detail
optional instance
optional errors: Record<string, string[]>
optional requestId
```

- Branch on HTTP status and stable `code`, never English `detail`.
- Prefer response `X-Request-ID`, falling back to body `traceId`.
- Never send a client-generated `X-Request-ID` to the backend.
- Surface request IDs only as support information with a copy action.
- Map `errors.file` to uploads and `errors.request` to the form-level summary.
- Do not fabricate request IDs for network failures.
- Static-media failures are ordinary image failures, not ProblemDetails.

### 6.4 Query and pagination rules

- Preserve `0` and `false` during query serialization.
- Omit `null`, `undefined`, and operation-defined empty strings.
- Route locale owns backend `lang`; ignore a query-string `lang` value.
- Public page size remains 20 during Chapters 2–5.
- Result-affecting filter changes reset the page to 1.
- Use generated concrete page responses at the wire boundary and map them to a handwritten `Page<TView>` model.
- Offset pagination is the backend contract; do not invent cursors.

### 6.5 Media

- Resolve only expected API-relative `/uploads/...` paths through one helper.
- `MEDIA_BASE_URL` provides the only accepted media origin.
- Reject unexpected absolute, protocol-relative, or non-upload paths.
- Restrict `next/image` remote patterns to the configured origin and `/uploads/**`.
- Missing media uses an accessible visual fallback.
- Client-side upload checks for type, size, and count are advisory; backend validation is authoritative.
- Never automatically retry uploads or other mutations without an idempotency contract.

### 6.6 Authentication and session boundary

Authentication is intentionally implemented after Chapter 5, but its architecture is locked now:

- Use an explicit same-origin BFF.
- Backend access tokens are stored only in an HttpOnly cookie and are never returned to browser JavaScript or persisted in Web Storage.
- Production cookie name is `__Host-realestate_session`; development uses a non-prefixed equivalent.
- Cookie options are HttpOnly, Secure in production, SameSite Lax, Path `/`, no Domain, and expiry derived from JWT `exp`.
- Decoded JWT claims are lifecycle hints only; backend responses remain authoritative for identity, status, roles, and permissions.
- Registration does not create a session because the backend returns no token.
- Frontend logout deletes the cookie but does not claim backend token revocation.
- Unsafe BFF routes validate same-origin `Origin`/`Host`; SameSite alone is insufficient CSRF protection.
- Proxy performs only optimistic redirects. Protected layouts and operations must revalidate through the backend.
- A 401 enters session-expiry/login handling; a 403 retains the session; a 409 presents current-state recovery.
- PendingVerification and Disabled users retain their documented backend behavior.

The backend's unresolved production JWT placeholder is an external deployment blocker. The frontend cannot certify a production launch until backend deployment configuration resolves it.

## 7. Dependency Policy

### Keep

```text
next
react
react-dom
lucide-react
next-themes
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

### Add in Chapter 1

Runtime:

```text
zod
clsx
tailwind-merge
class-variance-authority
server-only
```

Development:

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

### Add when first used

```text
Chapter 2: msw
After Chapter 5 mutation-form phase: react-hook-form, @hookform/resolvers
```

### Do not add during Chapters 1–5

```text
@tanstack/react-query
Redux or Zustand
Axios
Auth.js
an i18n framework
a general UI kit
Storybook
a toast framework
a URL-state library
a generated runtime API SDK
```

Retain the current PostCSS override unless dependency evidence proves it is obsolete. Dependency additions must have an owning capability and chapter; do not add packages for hypothetical future use.

## 8. Existing-Code Migration Map

### Keep or adapt

```text
package manager and lockfile
Next/React/TypeScript versions
TypeScript path alias and strict baseline
ESLint/Prettier/PostCSS baseline
Tailwind semantic-token concept
English and Macedonian dictionary copy
locale-aware formatting logic
next-themes mechanics
favicon until real branding replaces it
CLAUDE.md reference to AGENTS.md
```

### Move or replace

```text
root layout                   -> locale root layout
global CSS                    -> accessible global/token styles
theme provider/toggle         -> final provider and localized System/Light/Dark control
i18n index/config             -> server-loaded locale architecture
site/routes/navigation config -> localized implemented-route configuration
generic API client            -> typed generic server transport
listing wire types            -> generated wire types and handwritten view models
listing filters               -> validated URL search schema
listing service               -> feature-owned server operations
homepage demo                 -> localized discovery entry point
```

### Delete only after replacement and validation

```text
obsolete demo UI
empty .gitkeep feature/route scaffolds
unsupported saved/admin-user/admin-listing navigation
stale handwritten API contracts
create-next-app README content
stale frontend-context claims
```

Tracked and untracked files must always be inventoried separately. If unexpected work appears, inspect and migrate useful behavior before removing it. Never use a broad cleanup command as a migration mechanism.

## 9. Roadmap: Chapters 1–5

### Chapter 1 — Frontend Operating System and Localized Public Shell

Establish locale-prefixed routing, accessible public shell, environment validation, semantic tokens, theme ownership, generated API types, generic transport/error/media foundations, import rules, and the complete test harness.

### Chapter 2 — Public Listings Catalog Vertical Slice

Deliver the first real backend-backed route with listing cards, basic shareable filters, primary images, total count, pagination, and complete loading/empty/error handling.

### Chapter 3 — Complete Public Search and Filters

Expose the completed backend discovery contract with advanced property filters, dependent-filter cleanup, progressive GET behavior, URL restoration, mobile focus management, and exhaustive query tests.

### Chapter 4 — Listing Details and Comparables

Build localized, indexable listing detail pages with complete apartment/house data, an accessible gallery, truthful optional fields, canonical 404 behavior, and comparable listings.

### Chapter 5 — Public Agency Pages and Anonymous-Journey Hardening

Add public agency profiles/listings, agency attribution, homepage discovery entry, stable sitemap/robots policy, and the complete home-to-agency anonymous E2E journey.

Do not create separate Chapter 2–5 specifications until implementation feedback is available and the next chapter is ready to begin.

## 10. Locked and Revisitable Decisions

### Locked through Chapter 5

- selective rebuild;
- Next server runtime;
- `/mk` and `/en` canonical prefixes with correct document language;
- Server Components by default;
- no Server Component calls to internal Route Handlers;
- URL-owned public search state;
- generic transport separated from feature operations;
- generated wire types separated from handwritten operations/view models;
- typed ProblemDetails and request-ID handling;
- server-only API origin and central media resolver;
- Tailwind 4, semantic tokens, and `next-themes`;
- WCAG 2.2 AA and automated/manual accessibility gates;
- no general global state or TanStack Query during the public phase;
- future BFF/HttpOnly-cookie authentication rather than browser-readable JWT storage;
- no catch-all backend proxy;
- backend permission and lifecycle authority;
- no unsupported product features.

### Revisitable after Chapter 5

- exact palette, spacing scale, and primitive APIs;
- public cache/revalidation duration;
- filter prominence and mobile grouping;
- an i18n framework if more locales or rich message needs justify it;
- TanStack Query for authenticated mutation-heavy workflows;
- a headless component dependency for proven complex widgets;
- CDN/object-storage media strategy;
- dynamic sitemap/feed strategy;
- map provider and map/list synchronization;
- browser matrix, performance budgets, Storybook, and visual regression.

Reopen a locked decision only with concrete evidence such as a deployment limitation, a backend authentication-contract change, unusable generated OpenAPI, a third locale, measured performance problems, or real usability findings. Tool preference alone is not evidence.

## 11. Ultra Re-entry

Use Ultra again immediately after Chapter 5 and before authentication or mutation-heavy account/workspace development.

Bring:

```text
final tree and dependency manifest
implemented architecture deviations and reasons
generated OpenAPI output and drift results
unit, component, Playwright, and axe results
production build output
deterministic fixture approach and real-backend smoke findings
representative ProblemDetails and request IDs
media failure evidence
search URL, canonical, and metadata behavior
performance and accessibility findings
user feedback from the anonymous journey
unresolved backend handoff issues
precise Git status
```

The following phase should then plan BFF authentication, registration/session-expiry UX, current-user profile/avatar, personal listing creation/lifecycle/images, and later agency workspace/admin flows from actual frontend evidence.

## 12. Current Handoff

The next Codex session must implement only:

```text
Chapter 1 — Frontend Operating System and Localized Public Shell
```

Required reading order:

1. `AGENTS.md`
2. this file
3. `docs/chapters/chapter-1-frontend-foundation.md`
4. the narrow installed Next.js 16 documentation relevant to files being changed
5. the exact current files in Chapter 1 scope

Do not broadly reread the backend. The Chapter 1 specification contains the integration rules needed for implementation. Inspect a narrow backend/OpenAPI detail only if the implementation encounters a genuine contradiction.

Before writing code, recheck Git state. Implement checkpoints in order, run focused tests during each checkpoint, and complete every gate in the Chapter 1 document before declaring the chapter complete.
