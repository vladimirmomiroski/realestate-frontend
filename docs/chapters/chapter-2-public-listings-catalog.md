# Chapter 2 — Public Listings Catalog Vertical Slice

## Status

**Implementation through 2P and subsequent 2R/2S hardening accepted and integrated.
2Q documentation and final verification await independent closeout audit.**

The owner confirms independent acceptance; Git ancestry and source were checked
on 2026-10-31. Frontend baseline `0365baf` includes 2S implementation `e6ba5f9`.
Backend `development` at `808c6a9` includes 2R `8473abc` and the historical-provenance
test correction `e732562`. Section 12 retains the bounded checkpoint specification;
section 15 reconciles it with implementation, approved deviations and evidence.
This document does not self-approve 2Q or start Chapter 3.

## 1. Chapter objective

Deliver the first real, localized frontend product slice at `/mk/listings` and
`/en/listings`: an anonymous, server-rendered catalog of real public listing data
from `GET /api/listings` with a deliberately small shareable search surface,
listing cards, a result count, fixed-size pagination, and complete loading, empty,
invalid-query, failure, and retry behavior.

The result must be usable and credible on narrow and wide screens in Light and Dark
themes. It should establish only the visual decisions necessary to evaluate the
catalog: card density, image treatment, typography, spacing, search shape, filter
density, and responsive behavior. It is not the final design language for the rest
of the application.

## 2. Explicit in-scope behavior

- Canonical localized routes `/mk/listings` and `/en/listings` inside the existing
  public shell.
- Anonymous server-side retrieval from the real `GET /api/listings` operation.
- The route locale sent as backend `lang`; query-string `lang` is never trusted.
- A fixed frontend `pageSize` of 20.
- Default backend `newest` ordering; no Chapter 2 sort control.
- Shareable URL state for:
  - `q` keyword/location search;
  - `listingType` (`Sale` or `Rent`);
  - `propertyType` (`Apartment` or `House` in the compact Chapter 2 filter);
  - one-based `page`.
- A progressively enhanced GET search form using the localized listings path.
- Search submission that resets pagination because the form does not carry `page`.
- A clear/reset link back to the locale's clean listings route.
- Listing cards showing only catalog-relevant information:
  - primary image or a neutral missing/unavailable-media fallback;
  - backend-authored title;
  - compact location assembled from available neighborhood, municipality, and city;
  - localized listing type and property type;
  - price and currency;
  - area;
  - rooms when present;
  - price per square metre when present.
- A localized total-result summary.
- Previous/next pagination links that preserve the valid Chapter 2 filters.
- Localized form/link pending feedback; the approved 2K revision deliberately
  replaces the original route-skeleton proposal to preserve no-JavaScript rendering.
- Separate zero-results, invalid-search, and out-of-range-page presentations.
- Localized API/network failure presentation with retry and a real backend request
  ID when one is available.
- Localized listings metadata, canonical and language-alternative URLs, and the
  `noindex,follow` policy for every query-bearing catalog document.
- Deterministic unit/component/browser fixtures that require no running backend for
  normal validation.
- Bounded real-backend contract verification, with its distinct historical scopes
  recorded in section 15.
- Keyboard, focus, contrast, reflow, reduced-motion, semantic, axe, and Chromium
  verification for representative catalog states.

## 3. Explicit deferred behavior

The following are not Chapter 2 work:

- listing details, detail links, comparables, galleries, or contact actions;
- all price, currency, area, room, municipality, neighborhood, agency, amenity,
  subtype, furnishing, condition, heating, basement, elevator, and yard filters;
- a sort control, including price sorting and its required currency coupling;
- filter drawers, dialogs, saved views, chips requiring client draft state, or
  dependent-filter cleanup;
- maps or list/map synchronization;
- favorites, saved searches, authentication, profiles, or account UI;
- listing creation, editing, lifecycle actions, image uploads, or media management;
- agency attribution, public agency pages, workspaces, or administration;
- cursor pagination, infinite scroll, or client-side query caching;
- analytics, recommendations, scoring, valuation, market averages, or AI claims;
- homepage redesign, a hero/cover-image treatment, or a site-wide visual redesign;
- a broad component library, broad token expansion, Storybook, or visual regression;
- a new backend endpoint, catch-all proxy, or browser-readable API configuration.
  The separately authorized backend 2R remediation is recorded in section 15.

## 4. Existing frontend foundation being reused

Chapter 2 reuses these completed Chapter 1 boundaries without redesigning them:

- Next.js 16.3 App Router, React 19, TypeScript strict mode, and Tailwind CSS 4;
- canonical `/mk` and `/en` locale routing through `src/proxy.ts`;
- the locale root layout, public route group, public shell, skip link, locale
  switcher, and System/Light/Dark theme control;
- server-loaded, compile-time-complete dictionaries and the narrow client dictionary;
- locale-required route helpers and query-preserving locale switching;
- validated server/build `API_BASE_URL`, `MEDIA_BASE_URL`, and `SITE_URL`;
- generated wire declarations in `src/contracts/generated/openapi.d.ts`;
- `requestApi` for server-only native-fetch mechanics and classified failures;
- deterministic query serialization;
- the generic `Page<T>` view model;
- the central `/uploads/...` media resolver and exact Next Image remote pattern;
- the retained listing label and number/price/area formatter utilities;
- semantic theme tokens and existing focus/reduced-motion baselines;
- Vitest, Testing Library, Playwright, Chromium, and axe;
- current import, feature ownership, and `.server.ts` enforcement rules.

Chapter 2 added no runtime dependency. Its handwritten strict response adapter,
native fetch mocks and test-owned HTTP fixture reuse the established infrastructure.

## 5. Actual backend contracts being consumed

### 5.1 Operation summary

| Property           | Confirmed contract                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| Method/path        | Anonymous `GET /api/listings`                                                     |
| Success            | `200` with `PublicListingResponsePagedResponse`                                   |
| Validation failure | `400 application/problem+json` with validation errors                             |
| Unexpected failure | `500 application/problem+json`                                                    |
| Correlation        | Optional response `X-Request-ID`, also represented as `traceId` in ProblemDetails |
| Visibility         | Public repository query always applies `ListingStatus.Active`                     |
| Pagination         | Deterministic one-based offset pagination                                         |
| Default order      | `newest`: `CreatedAtUtc DESC`, then `Id DESC`                                     |
| Authentication     | None                                                                              |
| Caching            | The frontend explicitly uses `cache: "no-store"`                                  |

The generated declaration is the frontend wire authority. The current backend
controller, query, validator, handler, repository, mapping, and backend context were
inspected narrowly to confirm behavior that OpenAPI cannot fully express.

### 5.2 Supported request query

The backend currently supports all of the following. Documenting a field here does
not put it in the Chapter 2 UI.

| Query key                                            | Type/current behavior                                                                                                                  | Chapter 2 use                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `lang`                                               | String; normalized to lower case; effective translation preference is requested language, then `mk`, then deterministic language order | Always route locale; never read from URL query   |
| `q`                                                  | Trimmed string, 2–100 characters; case-insensitive literal contains search over effective title, city, municipality, and neighborhood  | Exposed                                          |
| `listingType`                                        | `Sale` or `Rent`                                                                                                                       | Exposed                                          |
| `propertyType`                                       | `Apartment`, `House`, `Commercial`, or `Land`                                                                                          | Exposed only as `Apartment`/`House` in Chapter 2 |
| `agencyId`                                           | UUID                                                                                                                                   | Deferred                                         |
| `heatingType`                                        | `Unknown`, `None`, `Electric`, `Central`, `Gas`, `Wood`, `HeatPump`, or `Other`                                                        | Deferred                                         |
| `furnishingStatus`                                   | `Unknown`, `Unfurnished`, `SemiFurnished`, or `Furnished`                                                                              | Deferred                                         |
| `condition`                                          | `Unknown`, `New`, `Renovated`, `Good`, `NeedsRenovation`                                                                               | Deferred                                         |
| `hasBasement`                                        | Boolean                                                                                                                                | Deferred                                         |
| `hasElevator`                                        | Boolean; matches apartments with apartment details                                                                                     | Deferred                                         |
| `apartmentType`                                      | `Unknown`, `Studio`, `Standard`, `Penthouse`, `Duplex`, `Loft`, `Maisonette`, or `Other`                                               | Deferred                                         |
| `houseType`                                          | `Unknown`, `Detached`, `SemiDetached`, `Terraced`, `Townhouse`, `Villa`, `Cottage`, or `Other`                                         | Deferred                                         |
| `commercialType`                                     | `Unknown`, `Office`, `Shop`, or `Other`                                                                                                | Deferred                                         |
| `landType`                                           | `Unknown`, `BuildingPlot`, `AgriculturalLand`, or `Other`                                                                              | Deferred                                         |
| `minYardAreaSquareMeters`, `maxYardAreaSquareMeters` | Inclusive, non-negative range; minimum cannot exceed maximum                                                                           | Deferred                                         |
| `minPrice`, `maxPrice`                               | Inclusive values greater than zero; minimum cannot exceed maximum; requires `currency`                                                 | Deferred                                         |
| `currency`                                           | Exactly three ASCII letters after trim/uppercase; required for price filters and price sorting                                         | Deferred                                         |
| `minAreaSquareMeters`, `maxAreaSquareMeters`         | Inclusive values greater than zero; minimum cannot exceed maximum                                                                      | Deferred                                         |
| `minRooms`, `maxRooms`                               | Inclusive, non-negative range; listings with null rooms do not match                                                                   | Deferred                                         |
| `city`, `municipality`, `neighborhood`               | Trimmed, at most 100 characters; case-insensitive exact match against the effective translation                                        | Deferred as structured controls                  |
| `sort`                                               | `newest`, `priceAsc`, or `priceDesc`, parsed case-insensitively; price order requires `currency`                                       | Omitted so backend default `newest` applies      |
| `page`                                               | Values below 1 normalize to 1; default 1                                                                                               | Exposed after frontend validation                |
| `pageSize`                                           | Values below 1 normalize to 20; above 100 cap at 100; default 20                                                                       | Always fixed to 20 by frontend operation         |

`q`, city, municipality, and neighborhood operate on the single effective
translation chosen for the requested language. The backend escapes `%`, `_`, and
`\`, so they are literal search characters rather than wildcard input.

The backend supports four root property types and both subtype families. The
Chapter 2 property-type **filter** intentionally offers only Apartment and House
as a compact product-scope choice; this is not a backend limitation. An unfiltered
catalog can return all four roots, so card labels and rendering at 2D must handle
Commercial and Land truthfully. Subtype controls remain deferred.

### 5.3 Response envelope

The successful JSON shape is:

```text
items: PublicListingResponse[]
page: normalized one-based page
pageSize: normalized page size
totalCount: total matching Active listings
totalPages: ceil(totalCount / pageSize), or 0 when totalCount is 0
hasNextPage: page < totalPages
hasPreviousPage: page > 1
```

An out-of-range positive page returns `200`, an empty `items` array, the requested
page, the real `totalCount`/`totalPages`, and `hasPreviousPage: true`. It is not a 404. When there are no matches, `totalPages` is 0; `hasPreviousPage` can still be
true if the requested page is greater than 1. The frontend must use `totalCount`
and `totalPages`, not a boolean alone, to choose the state presentation.

### 5.4 Listing fields relevant to the catalog

`PublicListingResponse` contains identity, listing/property/status enums, price,
currency, area, computed price per square metre, optional room/bathroom and other
property facts, localized title/description/address/location, `languageCode`,
`primaryImageUrl`, nullable root-specific details, and the ordered image collection.
Its `languageCode`, `title`, `city`, `municipality`, `addressLine`, `description`,
`latitude`, `longitude`, and `locationPrecision` are required and non-null.
`neighborhood`, primary media, and root-specific details remain nullable or optional.
Private `ListingResponse` and Draft/management DTOs retain their own nullable fields.

Chapter 2 maps only the card subset into a handwritten view model. It does not copy
the complete DTO. Generated properties are frequently optional because of the
current OpenAPI generation shape even where the C# response assigns a value, so the
feature adapter must validate the fields it actually consumes and classify a bad
success body as malformed rather than assert it into the UI.

Public responses should contain only `status: Active`. The adapter should validate
that invariant and must never display a public status control or badge implying
other states are discoverable.

### 5.5 Translation and content language

For each listing, the backend chooses the requested language, then Macedonian, then
the first language by deterministic PostgreSQL `C` ordering (with translation ID as
the final mapping tie-breaker). The response `languageCode` identifies the selected
content language.

The document `lang` stays equal to the route locale. When a card's backend-authored
title/location uses a different supported or valid language code, the card content
wrapper receives that actual `lang`. Frontend labels and controls always come from
the route dictionary. Backend text is not translated or rewritten by the frontend.

### 5.6 Image and media behavior

- `primaryImageUrl` is an API-relative `/uploads/...` path.
- The backend selects the explicit primary image, otherwise the first image by
  `sortOrder`, otherwise null.
- The full `images` collection is sorted by `sortOrder`, but Chapter 2 does not build
  a gallery and consumes only `primaryImageUrl`.
- The frontend resolves the path only through the existing media resolver and exact
  configured origin.
- A missing or rejected path renders the neutral placeholder.
- A valid path that later returns an ordinary static-media 404 also falls back
  without being treated as API ProblemDetails.

### 5.7 Failure contract

The operation documents `400` validation and `500` unexpected responses. Framework
binding errors for invalid enum/number query values also use the canonical validation
ProblemDetails shape. Stable branching uses HTTP status and `code`, normally
`validation.failed` or `server.unexpected`; English title/detail is not a branch key.

The existing transport also classifies non-JSON failures, malformed successful
responses, network failures, and aborts. Chapter 2 presents a localized catalog
failure, retains a real response request ID when available, and never fabricates one.

## 6. Implemented architecture and server/client boundaries

```text
localized listings page (Server Component)
  -> parse and validate Chapter 2 URL state
  -> feature-owned get-public-listings.server.ts
  -> generic requestApi(cache: "no-store")
  -> GET /api/listings
  -> narrow runtime contract adapter
  -> Page<PublicListingCard>
  -> server-rendered search, results, cards, and pagination
```

Ownership:

- `src/app/[locale]/(public)/listings/` owns the page, localized metadata,
  unexpected-error boundary, and composition only; it has no `loading.tsx`.
- `src/features/listings/api/` owns the endpoint path, generated operation types,
  consumed-response validation, mapping, and server operation.
- `src/features/listings/model/` owns the small card and catalog-state view models.
- `src/features/listings/search/` owns the Chapter 2 URL schema, normalization,
  validation, and URL construction.
- `src/features/listings/components/` owns the search surface, listing media/card,
  result layout, states, and pagination.
- `src/components/feedback/refresh-error-state.tsx` owns current-URL refresh and
  genuine request-ID copy interaction.
- `src/lib` remains unchanged unless a proven generic defect is discovered.

Server Components remain the default. Search and filters use `next/form` with a
string localized action, so they perform GET navigation with progressive
enhancement. Pagination uses normal Next links. Narrow client islands handle image
failure, refresh/copy/error boundaries, form/link pending status, and resetting
uncontrolled search controls when a different raw URL commits. Search parsing,
retrieval, results and pagination metadata remain server-owned. Catalog entry
points use `prefetch={false}` as the accepted 2S mitigation described in section 15;
they retain enhanced navigation and native GET fallback.

No Client Component receives a full dictionary. It receives only the labels it
renders. There is no Route Handler, client-side backend fetch, global store, query
library, or browser-visible API transport configuration. Resolved public media
resource URLs may appear in image markup.

## 7. URL and search-state approach

### 7.1 Canonical route state

The clean catalog is `/{locale}/listings`. Chapter 2 recognizes only:

```text
q
listingType
propertyType
page
```

The page awaits Next.js 16 `params` and `searchParams`. `searchParams` is treated as
a plain asynchronous object whose values can be strings, arrays, or undefined.

### 7.2 Normalization and validation

- `lang` from the query is ignored; the route locale always wins.
- `q` is trimmed. Empty text is absent. Nonempty text outside 2–100 characters
  produces localized field feedback and suppresses the backend request.
- Repeated `q` is invalid rather than picking a surprising value.
- Unknown or repeated listing/property enum values normalize to no selection.
- `page` accepts one positive base-10 integer within the backend's 32-bit range;
  absent/invalid/repeated values normalize to 1.
- The operation sends `pageSize: 20` and does not expose it as browser state.
- Unknown URL keys are never forwarded to the backend and are not reproduced by
  Chapter 2 controls. They do not require a redirect merely to render the page.
- Chapter 2 does not add a URL-state dependency or a generic query framework.

Valid filter URLs are shareable and restore the form values on direct load.
Submitting the GET form naturally resets to page 1 because it does not include a
page input. Pagination links are produced by the feature search helper and preserve
only the valid active Chapter 2 state.

Committed URL identity and normalized backend query state are separate concerns.
2S resets dirty controls after pagination or history navigation even when distinct
raw URLs normalize identically, while same-URL rerenders preserve unsubmitted edits.

### 7.3 Indexing policy

- The clean catalog is `index,follow` with its localized canonical and language
  alternatives.
- Any query-bearing catalog URL is `noindex,follow` and canonicalizes to the clean
  locale catalog.
- Language alternatives for the clean canonical point to the clean catalog in the
  other supported locale.
- Locale switching continues to preserve the current query so users retain their
  search context; metadata policy, not forced URL deletion, controls crawl growth.

Proxy captures original query presence with documented `skipProxyUrlNormalize`
before Next.js can strip names such as `__proto__`, `_rsc`, `nxtPq` and `nxtIfoo`.
It overwrites the internal request signal, including spoofed client values. Exact
`RSC: 1` requests select Flight rather than an indexable HTML document; only that
representation excludes the framework's `_rsc` transport key. Prefetch hints alone
do not change document policy. This is a representation boundary, not authentication.
Direct HTML, no-JavaScript, spoofed-header and enhanced-navigation tests guard it.

## 8. Loading, invalid, empty, error, and retry behavior

### Loading

Revised Checkpoint 2K uses localized inline pending feedback for enhanced search
and pagination navigation. It preserves ordinary GET rendering without JavaScript;
the verified native route-loading incompatibility and skeleton deferral are recorded
in Checkpoint 2K below. The current catalog and public shell remain usable while
navigation is pending.

### Invalid search

A direct or submitted invalid `q` shows an inline localized field error associated
with the input and a concise validation summary. The server does not call the
backend until the query is valid. Invalid enum/page URL values safely normalize as
described above rather than becoming backend validation failures.

### Empty results

When `totalCount` is zero, show a calm localized no-results state. If a filter is
active, include a clear-search link. Do not show pagination or imply that listings
exist elsewhere.

### Out-of-range page

When `totalCount` is positive but the requested page has no items, explain that the
page has no results and provide a link to page 1 with the valid filters preserved.
Do not reuse the true zero-results message and do not invent a 404.

### Known API/network failure

Known classified failures render a localized catalog error inside the route while
preserving the public shell. The retry control refreshes the current URL. A genuine
backend request ID is labelled as support information. Network failures display no
fake ID. Technical English backend detail is not the user-facing message.
The no-JavaScript retry link reloads the same URL. Copy feedback is isolated by
request ID and accepts only the latest copy attempt's completion; stale promises
cannot report success or failure for a new ID or overwrite newer feedback.

### Unexpected rendering failure

A route-local `error.tsx` handles unexpected exceptions with Next.js 16.3's stable
`retry` prop and the generic localized error copy. It logs the client-visible error
for development diagnosis without exposing server exception detail.

## 9. Accessibility expectations

- One page `h1`, followed by logical section headings without skipped levels.
- A labelled search landmark or search form with explicit labels for text/select
  controls; placeholders are not labels.
- Native input/select/button/link semantics and no custom combobox in Chapter 2.
- Search errors associated using `aria-describedby`; validation summary announced.
- Result count announced as normal content, not a noisy live region on first load.
- Each listing is a semantic `article` with a clear accessible name.
- Cards are not focusable or clickable because the detail route is deferred.
- Backend-authored fallback-language content uses its actual `lang` where known.
- Listing preview images use empty alt text when the adjacent card text already
  supplies the same listing identity. The unavailable-image state has concise
  localized text and does not expose a broken-image icon.
- Pagination has a localized navigation label, unambiguous previous/next names,
  current-page text, and no disabled element masquerading as a link.
- All controls retain visible focus, keyboard operation, and at least WCAG 2.2
  minimum target size, with the practical existing 44px target where possible.
- Text, controls, boundaries, focus rings, and image-placeholder content meet WCAG
  2.2 AA in Light and Dark.
- The catalog reflows at 200% zoom equivalent and 320 CSS pixels without horizontal
  clipping or two-dimensional scrolling.
- Loading and image fallback do not depend on animation; reduced motion remains
  respected.
- Representative clean, filtered, empty, and error pages have no serious or
  critical axe violations.

## 10. Responsive expectations

- Keep the catalog aligned with the existing shell container rather than creating a
  new global width system.
- Search is the visually dominant action, but it remains compact and content-first.
- On narrow screens, the keyword field, selects, and actions stack in logical focus
  order and remain full-width where useful.
- On wider screens, the keyword field takes priority and the two compact selects sit
  beside it without forming a dense advanced-filter toolbar.
- Cards use a consistent media ratio and stable content rhythm so missing images or
  optional rooms do not collapse the layout unpredictably.
- Start with one card column on narrow screens, two at medium widths, and at most
  three within the current shell width after browser review confirms readable
  density.
- Price and title lead the hierarchy; location and compact facts are secondary.
- Long Macedonian labels, long backend titles/locations, large prices, and missing
  optional fields wrap or truncate deliberately without overflow.
- Pagination remains easy to operate with one hand on mobile and does not require a
  large numeric page strip.

## 11. Minimal Chapter 2 design direction

The catalog is the first real design prototype, not a design-system project.

Chapter 2 establishes only:

- a quiet surface-led page with restrained borders/shadows and no hero image;
- a strong search bar proportion and two compact type filters;
- a repeatable listing-card media ratio and information hierarchy;
- a readable balance between 20-result density and adequate whitespace;
- limited use of the existing primary/accent colors for actions and focus, not
  decorative panels;
- typography, spacing, and photography as the premium signals;
- an equally intentional Dark presentation using existing semantic tokens;
- subtle hover/focus feedback only where an element is interactive.

Do not add global tokens merely to encode one tentative card decision. Use existing
semantic tokens and local Tailwind composition first. Add or alter a semantic token
only if browser/contrast evidence shows the current catalog cannot be expressed
accessibly.

The card has no favorite affordance, verification badge, score, agency promise,
market comparison, or click treatment. The UI must never look interactive where no
implemented destination or action exists.

## 12. Small-checkpoint implementation plan

This section retains the implementation scope and dependency record. 2A–2P and
the post-2B contract synchronization are implemented and accepted; the later
2R/2S corrections and current 2Q verification are reconciled in section 15.

Every checkpoint gets its own branch from the accepted previous checkpoint. The
estimated size is product/implementation code, excluding tests, fixtures, generated
output, and documentation. Do not begin the next checkpoint until the current one
has its focused success condition reviewed.

### Checkpoint 2A — Localized catalog route frame

- **Exact objective:** Add the real localized listings route inside the public shell,
  its truthful heading/subtitle, and the implemented Listings navigation entry. This
  is a visible route frame, not a data mock.
- **Expected files:**
  - `src/app/[locale]/(public)/listings/page.tsx`
  - `src/config/navigation.ts`
  - `src/i18n/dictionaries/types.ts`
  - `src/i18n/dictionaries/en.ts`
  - `src/i18n/dictionaries/mk.ts`
  - focused navigation/dictionary tests
- **Approximate implementation size:** 100–150 lines.
- **Tests required:** Route/navigation helper tests and a focused browser assertion
  that both localized routes render in the public shell without backend traffic.
- **Explicit exclusions:** API types, fetching, URL parsing, cards, filters, metadata,
  loading, and state handling.
- **Completion condition:** `/mk/listings` and `/en/listings` render one localized
  heading in the existing shell and navigation points only to the implemented route.
- **Dependency:** Chapter 1 only.

### Checkpoint 2B — Narrow public-listings contract adapter

- **Exact objective:** Define the small card view model and validate/map the consumed
  generated `Listings_GetListings` success shape into `Page<PublicListingCard>`.
- **Expected files:**
  - `src/features/listings/model/public-listing-card.ts`
  - `src/features/listings/api/public-listings-contract.ts`
  - adjacent adapter tests and minimal wire fixtures
- **Approximate implementation size:** 150–200 lines.
- **Original 2B tests:** Valid page/card mapping; then-optional translated content and
  media; fallback language; non-Active item rejection; malformed identity/enums/
  numbers/page metadata rejection; no complete handwritten backend DTO. The
  post-2B sync below replaces the obsolete optional public-content assumptions.
- **Explicit exclusions:** Fetching, URL state, formatting UI, components, and error
  presentation.
- **Completion condition:** The adapter accepts a representative real contract page,
  produces only the card/page model, and fails malformed consumed fields.
- **Dependency:** 2A.

### Post-2B backend contract synchronization — prerequisite to 2C

- **Status:** Accepted and integrated before 2C; the strict four-root public contract
  remains the current generated/adapter boundary.
- **Source:** Final Chapter 15 Development Swagger and definitive backend/frontend
  handoff. Regenerate `openapi.d.ts`; update the narrow card model, runtime adapter,
  focused tests, and current-state documentation.
- **Contract correction:** Public list items use `PublicListingResponse` with all
  four property roots and nine required translation/location fields. Validate those
  fields before mapping; retain nullable neighborhood, media, and root details.
  Private Draft/management response nullability remains distinct.
- **Exclusions:** No server retrieval, catalog rendering, filters, or 2C work.
- **Completion condition:** Generated types match accepted Swagger, focused and
  normal frontend checks pass, and the bounded diff is independently accepted.

### Checkpoint 2C — Server-side listings retrieval

- **Exact objective:** Add the feature-owned server operation for anonymous catalog
  reads using generated query types, `requestApi`, `cache: "no-store"`, route locale,
  fixed `pageSize: 20`, and the 2B adapter.
- **Expected files:**
  - `src/features/listings/api/get-public-listings.server.ts`
  - adjacent server-operation tests
- **Approximate implementation size:** 80–130 lines.
- **Tests required:** Exact path; locale ownership; query forwarding; fixed page size;
  omission of absent values; no-store; success mapping; classified failures retained;
  no backend/network dependency.
- **Explicit exclusions:** Page composition, Route Handlers, retries, caching policy
  changes, and browser fetches.
- **Completion condition:** A unit test proves one typed server call maps an API page
  without exposing the API origin or contacting a live backend.
- **Dependency:** Accepted 2B and the post-2B contract synchronization audit/commit.

### Checkpoint 2D — First backend-backed listing cards

- **Exact objective:** Connect the clean catalog page to 2C and render real Active
  listing facts in a simple, intentionally unrefined card list using existing
  formatters and labels. Introduce only the minimum happy-path local public-listings
  HTTP fixture needed to review representative cards in a browser; it remains test
  infrastructure and is never available as product mock-mode code.
- **Expected files:**
  - `src/app/[locale]/(public)/listings/page.tsx`
  - `src/features/listings/components/public-listing-card.tsx`
  - adjacent component tests
  - `tests/fixtures/public-listings-api.mjs` with only representative happy-path data
  - `tests/e2e/public-listings.spec.ts` with only the first card-rendering smoke
  - `playwright.config.ts` to own fixture startup/shutdown
- **Approximate implementation size:** 140–200 lines.
- **Tests required:** Localized labels/formatting, optional facts, backend content
  language, semantic article/name, no detail/favorite link, and default server query;
  one deterministic browser happy path that displays representative cards without a
  Development seed or real backend.
- **Explicit exclusions:** Real images, final grid density, filters, pagination, and
  complete state styling; non-happy fixture modes, a product mock flag, or any fixture
  import from `src`.
- **Completion condition:** Against the local happy-path fixture, both locales can be
  opened in a browser and show the first truthful cards with price, title, location,
  type, area, and optional facts. Fixture startup/shutdown is test-owned and no
  product bundle or runtime path can select it.
- **Dependency:** 2C.
- **Visual milestone:** This is the first meaningful real-product UI checkpoint. 2A
  is visible earlier, but 2D is the first backend-contract-shaped card review in a
  real browser.

### Checkpoint 2E — Chapter 2 URL-state parser

- **Exact objective:** Parse and validate asynchronous URL state for `q`,
  `listingType`, `propertyType`, and `page`, derive the backend query, and build stable
  catalog URLs without a generic URL framework.
- **Expected files:**
  - `src/features/listings/search/public-listings-search.ts`
  - its unit tests
  - small integration in the listings page
- **Approximate implementation size:** 120–180 lines.
- **Tests required:** Missing/single/repeated values; whitespace; q bounds; exact
  enums; invalid/zero/negative/decimal/oversized page; locale-owned lang; fixed page
  size; stable URLs; filter changes omit page.
- **Explicit exclusions:** Search controls, advanced filters, redirects, global state,
  and backend validation-message reuse.
- **Completion condition:** Valid direct URLs change the server query predictably;
  invalid q suppresses fetch; other invalid state safely normalizes.
- **Dependency:** 2D.

### Checkpoint 2F — Keyword search surface

- **Exact objective:** Add the dominant localized `q` field, submit action, inline
  validation association, and clear-search behavior using `next/form` GET navigation.
- **Expected files:**
  - `src/features/listings/components/public-listings-search-form.tsx`
  - listings page and dictionary additions
  - adjacent component tests
- **Approximate implementation size:** 90–150 lines.
- **Tests required:** Accessible label; restored value; min/max hints; submit URL;
  invalid feedback; Enter submission; page reset; clear link.
- **Explicit exclusions:** Client state, debounce, autocomplete, structured location
  control, and advanced filters.
- **Completion condition:** A keyboard user can submit a valid shareable keyword
  search and return to the clean catalog without JavaScript-specific state.
- **Dependency:** 2E.

### Checkpoint 2G — Compact listing/property type filters

- **Exact objective:** Add only listing type and property type selects to the same
  search surface and refine its wide/narrow control density.
- **Expected files:**
  - `src/features/listings/components/public-listings-search-form.tsx`
  - dictionary additions
  - focused component tests
- **Approximate implementation size:** 100–160 lines.
- **Tests required:** Localized option labels; empty/all option; restored selections;
  combined q/type URL; submit resets page; logical keyboard order.
- **Explicit exclusions:** Sort, price/currency, area/room/location, property subtype,
  amenity filters, chips, drawers, and dependent cleanup.
- **Completion condition:** Search plus two compact backend-supported filters work in
  one GET surface without making the toolbar resemble the Chapter 3 advanced system.
- **Dependency:** 2F.

### Checkpoint 2H — Listing media treatment and failure fallback

- **Exact objective:** Add the fixed-ratio primary image treatment, server-side safe
  URL resolution, and the narrow client `onError` fallback for valid paths that fail.
- **Expected files:**
  - `src/features/listings/components/public-listing-media.tsx`
  - `src/features/listings/components/public-listing-card.tsx`
  - dictionary additions and focused tests
- **Approximate implementation size:** 100–160 lines.
- **Tests required:** Safe resolved URL; missing/rejected path; runtime image failure;
  empty alt for redundant preview; fallback text; stable frame dimensions.
- **Explicit exclusions:** Gallery, carousel, blur-data generation, uploads, image
  count, and alternate-image selection.
- **Completion condition:** Every card retains the same geometry with a valid image,
  no image, rejected media path, or static-media load failure.
- **Dependency:** 2D; scheduled after 2G so the combined search/card composition can
  be reviewed once before image emphasis is added.

### Checkpoint 2I — Result summary and catalog grid

- **Exact objective:** Introduce the localized total summary and the restrained
  responsive one/two/three-column result grid around the established card.
- **Expected files:**
  - `src/features/listings/components/public-listings-results.tsx`
  - listings page and focused component tests
- **Approximate implementation size:** 80–130 lines.
- **Tests required:** Correct localized total; zero/one/many grammar strategy that
  matches dictionary capabilities; stable article order; no list-semantic misuse;
  no overflow with long representative content.
- **Explicit exclusions:** Pagination, empty state, masonry, virtual scrolling, and
  final responsive polish.
- **Completion condition:** A 20-item page reads as one catalog, with an accurate
  count and reviewable desktop/mobile density.
- **Dependency:** 2H.

### Checkpoint 2J — Previous/next pagination

- **Exact objective:** Add a compact localized pagination landmark using backend page
  metadata and stable feature URL helpers.
- **Expected files:**
  - `src/features/listings/components/public-listings-pagination.tsx`
  - `src/features/listings/search/public-listings-search.ts`
  - listings page and adjacent tests
- **Approximate implementation size:** 120–180 lines.
- **Tests required:** First/middle/last page; previous/next targets; active filters
  preserved; fixed page size absent; no link when unavailable; accessible current
  page text; keyboard targets.
- **Explicit exclusions:** Numeric page strip, jump-to-page, infinite scroll, cursor
  pagination, and prefetch customization without evidence.
- **Completion condition:** Users can move between offset pages without losing valid
  Chapter 2 filters, and unavailable directions are plain noninteractive text/absent.
- **Dependency:** 2I.

### Checkpoint 2K — Local pending-navigation feedback (revised)

- **Architecture decision:** The original native `loading.tsx`/catalog-skeleton
  approach was verified in development and production to break accepted navigation
  without JavaScript: completed listing HTML arrives hidden in a streamed Suspense
  container, and JavaScript is required to replace the fallback. A plain Server
  Component fallback reproduces the issue, so client-context localization is not
  the cause. Preserve progressive enhancement by omitting the route loading boundary.
  Defer a full catalog-wide skeleton until a supported architecture is justified.
- **Exact objective:** Show concise localized inline pending feedback through
  React `useFormStatus` inside the existing string-action `next/form` and Next.js
  `useLinkStatus` inside pagination links. Both hooks were verified with held fixture
  responses in the installed versions. Retrieval, URL parsing, and page metadata
  remain server-owned; no global navigation coordinator is introduced.
- **Expected files:**
  - narrow form/link status components in `src/features/listings/components/`
  - existing search form and pagination composition, dictionaries, and focused tests
  - test-only response gate and catalog Chromium tests
- **Approximate implementation size:** Small leaf components and composition changes.
- **Tests required:** Real pending/completed navigation in both locales; one relevant
  status announcement; unchanged control names and focus; real destination listings;
  one retrieval per navigation; no clipping or motion dependence; accepted GET search,
  filtering, and pagination without JavaScript, including production verification.
- **Explicit exclusions:** Route-level streaming fallback, catalog-wide skeleton,
  global loader/coordinator, custom router, timers simulating pending state, artificial
  production delays, and animation dependencies.
- **Completion condition:** Supported hooks show truthful pending feedback until the
  destination commits, and ordinary GET navigation displays final server-rendered
  listings without JavaScript. Existing controls stay available throughout.
- **Dependency:** 2J.

### Checkpoint 2L — Empty and out-of-range result states

- **Exact objective:** Render distinct zero-match and positive-total/out-of-range
  states with the correct recovery links.
- **Expected files:**
  - `src/features/listings/components/public-listings-empty-state.tsx`
  - listings page, dictionaries, and focused tests
- **Approximate implementation size:** 90–150 lines.
- **Tests required:** Clean zero results; filtered zero results with reset; positive
  total but empty page with page-1 recovery; no pagination in either state; heading
  and announcement semantics.
- **Explicit exclusions:** Recommendations, suggested listings, automatic page clamp,
  redirect loops, and 404 behavior.
- **Completion condition:** The UI never labels an out-of-range page as a globally
  empty catalog and always offers a truthful bounded recovery.
- **Dependency:** 2J.

### Checkpoint 2M — Known failure, request ID, and retry

- **Exact objective:** Present classified API/network failures with localized copy,
  real request-ID support information, current-URL refresh, and a route-local
  unexpected error boundary using Next.js 16.3's stable `retry` prop.
- **Expected files:**
  - `src/features/listings/model/public-listings-error.ts`
  - `src/components/feedback/refresh-error-state.tsx` if the generic wrapper is used
  - `src/app/[locale]/(public)/listings/error.tsx`
  - listings page, dictionaries, and focused tests
- **Approximate implementation size:** 120–190 lines.
- **Tests required:** 400/500/problem/http/malformed/network mapping; request ID
  present/absent; no English-detail branching; refresh retry; route boundary retry;
  error state retains shell and focus semantics.
- **Explicit exclusions:** Toasts, telemetry service, automatic retry/backoff, auth
  handling, and changing the generic transport.
- **Completion condition:** A transient fixture failure can be retried successfully,
  and a correlated backend failure shows exactly its real support ID.
- **Dependency:** 2C and 2L.

### Checkpoint 2N — Localized catalog metadata and semantic audit

- **Exact objective:** Add localized listings metadata, canonical/language
  alternatives, query-aware robots policy, and close the catalog's component-level
  semantic/accessibility gaps before visual polish.
- **Expected files:**
  - `src/app/[locale]/(public)/listings/page.tsx`
  - dictionary metadata types/content
  - focused metadata/semantic tests
- **Approximate implementation size:** 80–130 lines.
- **Tests required:** Both localized titles/descriptions; clean canonical and
  alternates; clean index; any query noindex/follow; one h1; labelled search/results/
  pagination; card language annotations.
- **Explicit exclusions:** Listing detail metadata, sitemap enumeration, Open Graph
  image generation, and site-wide SEO redesign.
- **Completion condition:** Clean and query-bearing catalog URLs emit the locked SEO
  policy and the rendered structure passes the focused semantic audit.
- **Dependency:** 2M.

### Checkpoint 2O — Responsive and Light/Dark catalog refinement

- **Exact objective:** Review the real composed interface in browsers and make only
  evidence-backed catalog spacing, typography, density, wrapping, contrast, and
  mobile-control refinements.
- **Expected files:** Existing Chapter 2 components and, only if evidence requires,
  the smallest semantic token adjustment with token tests/evidence.
- **Approximate implementation size:** 80–160 lines of refinements.
- **Tests required:** 320px and 200%-equivalent reflow; representative desktop width;
  long Macedonian and backend content; Light/Dark contrast; visible focus; touch
  targets; reduced motion; missing-image layout stability.
- **Explicit exclusions:** Homepage redesign, new brand palette, new typography
  family, global spacing scale, animations, broad primitives, and post-Chapter-2
  visual decisions.
- **Completion condition:** The catalog is coherent and usable at the required widths
  and themes, with every change traceable to browser evidence.
- **Dependency:** 2N.

### Checkpoint 2P — Deterministic browser/accessibility and real-contract verification

- **Exact objective:** Expand and reuse the minimum happy-path public-listings HTTP
  fixture introduced in 2D for normal Playwright runs; verify the complete catalog
  journey and perform one bounded smoke check against the real Development backend
  contract.
- **Expected files:**
  - `tests/fixtures/public-listings-api.mjs` expanded with bounded scenario behavior
  - `tests/e2e/public-listings.spec.ts` expanded to the complete journey
  - `playwright.config.ts` only if expanded fixture orchestration requires adjustment
  - package script only if the fixture cannot remain owned by Playwright config
  - ignored local `docs/planning/` evidence during implementation, never committed
- **Approximate implementation size:** 0 product lines; approximately 150–250 lines
  of additional fixture/config code plus focused browser tests.
- **Tests required:** Both locales; exact server query including lang/page/pageSize;
  search and filters; page reset/restoration; pagination; image success/failure;
  pending navigation; zero/out-of-range/error/retry; locale switch query preservation; metadata;
  keyboard order; narrow reflow; Light/Dark; axe. Existing foundation E2E remains
  green. Real smoke validates a 200 page through the adapter and one validation
  ProblemDetails response without relying on seeded listing count.
- **Explicit exclusions:** Browser matrix expansion, permanent mock mode in product
  code, database seeding, backend changes, load testing, and visual snapshots.
- **Completion condition:** Normal E2E needs no real backend, the fixture is stopped
  automatically, the bounded real-backend smoke agrees with generated types, and all
  started frontend/backend processes are stopped.
- **Dependency:** 2O.

### Checkpoint 2Q — Chapter validation and documentation closeout

- **Exact objective:** Run all gates, reconcile durable documentation with the
  implemented result and recorded deviations, and mark Chapter 2 complete only if
  every criterion in section 13 is satisfied.
- **Expected files:**
  - `README.md`
  - `AGENTS.md` only if a lasting instruction changed
  - `docs/frontend-context.md`
  - `docs/frontend-quality-handoff.md` only for verified unresolved issues
  - this chapter document
- **Approximate implementation size:** 0 product lines.
- **Tests required:** `format:check`, lint, typecheck, unit/component tests, aggregate
  check, build, Playwright/axe, `git diff --check`, and explicit OpenAPI drift check
  when Development Swagger is available. Normal gates remain backend-independent.
- **Explicit exclusions:** Chapter 3 implementation or specification, broad visual
  planning, dependency upgrades, FE-TOOL-01 investigation, commit/merge/push without
  explicit authorization.
- **Completion condition:** Documentation describes actual Chapter 2 behavior,
  evidence and Git state are precise, test-owned servers are stopped, and generated
  output remains ignored. Later Chapter 3 planning requires its own authorization.
- **Dependency:** 2P and the subsequently accepted 2R/2S hardening.

## 13. Chapter completion criteria

Chapter 2 is complete only when all of the following are true:

1. Bounded checkpoints 2A–2P, the post-2B sync and subsequent 2R/2S remediation are
   implemented and reviewed; 2Q must receive independent audit before final closure.
2. `/mk/listings` and `/en/listings` render real anonymous `GET /api/listings` data
   through the feature-owned server operation.
3. API transport configuration remains server-only and the browser makes no direct
   listings API fetch. Resolved public media resource URLs are permitted.
4. Route locale owns `lang`, page size is fixed at 20, and default order is newest.
5. Valid q/listing/property/page URLs restore predictably; search/filter changes
   reset page; pagination preserves valid filters.
6. Cards show only truthful catalog fields, safe primary media, and actual content
   language; no card implies an unimplemented detail action.
7. Revised 2K pending feedback, invalid-q, true-empty, out-of-range, media-failure, API/network-error,
   unexpected-error, request-ID, and retry behavior are each verified.
8. Clean catalog metadata is localized and indexable; query-bearing catalog URLs are
   `noindex,follow` with the clean localized canonical.
9. Search, controls, cards, result summary, and pagination are usable by keyboard and
   meet WCAG 2.2 AA expectations in Light and Dark.
10. The page reflows without unintended horizontal overflow at 320 CSS pixels and
    the 200%-zoom equivalent; representative long Macedonian/backend content remains
    usable.
11. Chromium catalog journeys and representative axe checks pass against deterministic
    local fixtures with no real backend dependency.
12. A bounded Development-backend smoke confirms the committed generated contract;
    an empty real database is accepted and is not confused with a failed smoke.
13. `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`,
    `npm run check`, `npm run build`, and `npm run test:e2e` pass; test-owned servers
    stop and generated artifacts remain outside the tracked diff.
14. No frontend runtime dependency, Route Handler, global state, client query layer,
    or browser-readable API configuration was added. Backend changes are limited to
    the separately approved 2R remediation, not frontend feature expansion.
15. Documentation and Git status contain only intended Chapter 2 work; Chapter 3 and
    broader visual direction remain unimplemented.

## 14. Risks and deliberate non-goals

### Remaining contract cautions and separate handoffs

- The backend root `AGENTS.md` shows an older short filter list. Current generated
  OpenAPI, backend controller/query/validator/repository code, and backend context
  agree on the broader contract documented here; implementation must not use the
  stale short list as the wire authority.
- Many public response identity/price/area and page metadata members remain optional
  in generated TypeScript despite runtime success values. The nine strict public
  translation/location fields are required and non-null. The narrow runtime adapter
  must fail malformed consumed fields instead of using broad assertions.
- Normal browser tests use the Playwright-owned HTTP fixture introduced in 2D and
  expanded through 2P/2S. Real-backend verification must remain valid with zero items;
  a populated live Next.js journey is a different verification scope.
- `primaryImageUrl` is safe only after central resolution. A valid resolved upload
  can still return an ordinary static 404 and needs client-only image fallback.
- Backend q has a strict 2–100-character rule. Direct URL input needs frontend
  validation so a one-character query does not become a generic catalog failure.
- Price sorting/filtering requires a currency. Both are deferred together so Chapter
  2 cannot accidentally generate backend-invalid combinations.
- Out-of-range pages are successful empty pages, and backend `hasPreviousPage` alone
  does not distinguish them from a globally empty result. State selection must use
  total metadata.
- Listing detail is deferred even though a route helper already exists. Cards must
  remain noninteractive until the destination is implemented.
- Installed Next.js 16.3 documents the stable error-boundary `retry` prop. The
  existing locale-root error boundary still uses the earlier `unstable_retry` name;
  Chapter 2's route boundary must use the installed API, while any broader root
  cleanup requires its own evidence-bounded scope.
- FE-TOOL-01 remains a local installation reliability handoff and is not Chapter 2
  architecture work. Do not run `npm ci` or redesign dependencies around it.

### Design decisions deliberately postponed until after Chapter 2

- final brand identity, logo, palette, and typography choice;
- a global spacing/density scale or comprehensive component primitive API;
- homepage composition and whether later discovery entry needs richer imagery;
- listing-detail card-link treatment, gallery behavior, and full property hierarchy;
- advanced filter prominence, mobile drawer/dialog grouping, and dependent filters;
- map provider and map/list interaction;
- agency identity/attribution treatment;
- favorites/saved-state affordances and authenticated navigation;
- richer motion, transition language, skeleton system, and micro-interactions;
- global breakpoint strategy beyond evidence from this catalog;
- CDN/media transformation strategy;
- Storybook, visual regression, broader browser matrix, and performance budgets.

Those decisions should be made from the finished Chapter 2 interface in real
browsers, not predicted in this plan.

## 15. Closeout reconciliation and verification

### Implemented requirements

The accepted implementation through 2P and subsequent 2R/2S hardening satisfies
the following functional groups. This record supports **2Q independent audit**;
it does not itself approve final Chapter 2 closure.

| Requirements / completion criteria                             | Implemented boundary and verification                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous catalog, contract adaptation, locale, ordering (2–4) | `get-public-listings.server.ts` owns the server-only operation; generated wire types remain separate from `public-listings-contract.ts`. Fixed page size 20, route-owned language, no-store retrieval, and omitted sort preserve backend defaults. Fixture-observed requests and adapter/transport tests cover this boundary.                                       |
| Search, filters, pagination and history (5)                    | The 2E parser owns normalized backend state; GET form controls synchronize with committed browser URLs, including distinct raw URLs with equivalent normalized values. Page links retain valid filters; filter submission omits page. Both locales, dirty controls, history and no-JavaScript journeys are covered.                                                 |
| Cards, content language and media (6)                          | Four property roots render as named, noninteractive articles. Backend-authored language, exact-value location deduplication, optional facts and prices remain truthful. Central media resolution and the narrow image-error client boundary preserve 4:3 geometry.                                                                                                  |
| Pending, empty, failure and recovery (7)                       | Revised 2K uses form/link pending status. Invalid q suppresses retrieval; zero totals and positive-total empty pages have distinct recovery. Classified failures retain search context, genuine support IDs and current-URL retry; keyed clipboard state and latest-attempt guards prevent stale confirmations. Unexpected exceptions use the local route boundary. |
| Metadata (8)                                                   | Localized title/description, clean canonicals and both hreflang destinations are independent of retrieval. Every query-bearing HTML document is noindex/follow; clean documents are index/follow. Proxy ownership, stripped keys, spoofed headers and final enhanced-navigation head state have production tests.                                                   |
| Accessibility and layout (9–11)                                | Named search/results/pagination regions, explicit labels, article identity, language annotations and visible focus accompany a one/two/three-column grid. Browser checks cover long content, 320px reflow, themes, targets, reduced motion and representative axe scans. Automated checks do not certify complete WCAG conformance.                                 |
| Real contract and quality gates (12–13)                        | Historical real-backend checks and fresh 2Q gates are distinguished below. Normal browser runs remain fixture-owned and backend-independent.                                                                                                                                                                                                                        |
| Scope and ownership (1, 14–15)                                 | No new frontend runtime dependency or browser listings fetch was introduced. Backend 2R was separately authorized. 2Q changes documentation only; broader product work remains deferred and independent closeout approval is outstanding.                                                                                                                           |

### Approved deviations

- **2K:** Native route `loading.tsx` streaming left completed server content hidden
  without JavaScript. The accepted replacement is localized `useFormStatus` and
  `useLinkStatus` feedback. Absence of a catalog skeleton is intentional.
- **2S metadata lifecycle:** Targeted `prefetch={false}` on catalog entry,
  search/recovery, pagination and locale navigation avoids a repeatedly reproduced
  stale-head failure during speculative enhanced navigation. Links/forms still use
  enhanced navigation; this is not a forced document reload. A minimal reproduction
  also failed without Proxy. The exact internal cache-write mechanism was not proven;
  re-enabling prefetch requires repeated production head/history evidence.
- **Backend 2R:** The deep audit justified bounded backend invariant/offset repairs
  after the original frontend implementation. No DTO, generated contract or schema
  change was required.

### Deep-audit finding dispositions

| Finding                  | Verified disposition at the closeout baseline                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C2-01 — negative Rooms   | Backend Create/Update reject negative nullable decimal Rooms; null, zero and positive values remain valid. Publication readiness enforces the same invariant, and public mapping fails closed for corrupt Active records. Focused tests cover all four roots.                              |
| C2-02 — offset overflow  | Public, personal and agency repositories calculate offsets in Int64, compare against total count before narrowing, and return empty out-of-range items with the requested page and truthful metadata. Extreme-page and normal pagination regressions are retained.                         |
| C2-03 — dirty controls   | Accepted 2S separates normalized query semantics from committed URL identity; the narrow controls boundary resets on committed URL changes, including raw-equivalent URLs, while preserving same-URL edits.                                                                                |
| C2-04 — query SEO        | Proxy-owned original query presence complements page searchParams, including framework-stripped names. HTML query policy and Flight transport handling are separate; client input cannot override the owned signal. Targeted prefetch mitigation preserves final browser-head correctness. |
| C2-05 — currency         | The adapter requires exactly three ASCII letters, accepts mixed-case/uncommon codes, and rejects malformed values before formatting. Malformed-response classification retains the normalized genuine request ID.                                                                          |
| C2-06 — foundation retry | **Unresolved, inherited nonblocking finding:** locale-root `error.tsx` still uses `unstable_retry`; catalog-local errors use stable `retry`. Tracked in the quality handoff for a separate correction.                                                                                     |

Frontend 2S implementation `e6ba5f9` is merged at `0365baf` and is an ancestor of
this closeout branch. Backend `development` at `808c6a9` includes 2R (`8473abc`,
merged at `8043353`) and the historical provenance correction (`e732562`). Source
inspection confirms these dispositions; independent acceptance is supplied by the
owner's checkpoint record, not inferred from this documentation review.

### Historical verification — not fresh 2Q execution

- **2P (2026-10-27):** Genuine Development HTTP 200 with an empty page passed the
  accepted server operation/adapter; genuine HTTP 400 `validation.failed`
  ProblemDetails passed transport/request-ID normalization. The isolated database
  on `127.0.0.1:15432` had all 21 migrations. Smoke-owned resources were cleaned up;
  protected `realestate_db`, its 24 listings, 14 migrations and volume were preserved.
  This proves empty-response and validation contracts, not populated rendering.
- **2R:** Separately, isolated backend HTTP serialization returned nonempty Active
  Apartment/House/Commercial/Land records and extreme-page empty responses. The
  unchanged production frontend parser accepted those payloads. This was not a
  rendered Next.js page against a populated live backend. Retained evidence records
  404 focused and 2,446 full backend tests, plus a successful build. The full run
  preceded the 2R commit; the later historical-provenance assertion failure required
  the separate correction below.
- **Historical provenance correction:** The test now fingerprints
  `contract.SourceLineageCommit:src`, preserving the historical manifest and ancestry,
  disposition, migration and publication guards. Retained runs passed 28 affected,
  230 query-review and 2,446 full tests. Their timestamps precede the correction's
  commit; a full-suite rerun against the new committed HEAD was not located during
  2Q. Do not present those runs as post-commit verification.
- **2S:** Retained implementation evidence records 452 unit/component tests,
  107 Chromium tests (83 catalog, 22 foundation, 2 route-frame), 46 production
  regressions, 48 repeated production navigation checks and a successful build.
  Earlier failing metadata runs remain part of the investigation; the accepted
  targeted mitigation, rather than a single lucky run, is the baseline.
- **2O:** Retained acceptance includes actual browser 200% zoom and measured
  Light/Dark contrast. A fresh narrow-viewport/reflow test is not a new independent
  browser-zoom or manual contrast measurement.

Local evidence is intentionally ignored: frontend `docs/planning/chapter-2p-2026-10-27/`
and `docs/planning/chapter-2s/seo-investigation/`; backend investigation reports/TRX
remain in the local temporary evidence directories. These locations are not portable
CI artifacts. Preserve the distinction between recorded acceptance, inspected source
and personally rerun gates.

### Fresh 2Q verification — 2026-10-31

Baseline: frontend `0365baf6dea848e41a5355407664003dab977f02`, initially clean on
`feature/chapter-2q-chapter-closeout`. Only Markdown changes are included in 2Q.

| Command / scope                           | Result                                                                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                           | Formatting, ESLint and TypeScript passed; Vitest **452/452**, **31/31** files. This command runs `format:check`, `lint`, `typecheck` and `test`; those constituent results are not separate independent executions. |
| `npm run build`                           | Production Next.js 16.3 build passed; localized catalog remains a dynamic Server Component route.                                                                                                                   |
| `npm run test:e2e`                        | **107/107 Chromium tests**: 83 catalog, 22 foundation, 2 route-frame; no test retries or skips. Includes representative catalog/foundation axe, contrast, responsive, reduced-motion and keyboard checks.           |
| Established production Chromium selection | **46/46** passed against `next start`: metadata, direct raw-query/spoofed-header HTML, dirty controls/history, pending feedback, clipboard races and no-JavaScript navigation.                                      |
| Repeated production enhanced navigation   | **12/12** passed (`--grep 'enhanced.*navigation' --repeat-each 3`, both locales), with zero retries. These repeat existing cases, not additional unique coverage.                                                   |
| `npm run api:check`                       | Unavailable: live Swagger connection refused before fixture startup. No generated files changed; this is not a successful drift check.                                                                              |
| `git diff --check`                        | Passed; documentation-only scope.                                                                                                                                                                                   |

Production commands used the unchanged 2S local override of the standard Playwright
config, replacing `next dev` with `next start` while retaining the owned fixture.
The selection was run with
`node node_modules/@playwright/test/cli.js test public-listings --config docs/planning/chapter-2q-2026-10-31/verification/production.config.ts --grep 'metadata|indexing|dirty|raw query|spoofed|pending feedback|without JavaScript|native GET|overlapping clipboard|stale clipboard'`.
The temporary config was removed after verification. Logs remain under ignored
`docs/planning/chapter-2q-2026-10-31/`; no screenshots or generated artifacts enter
the diff. Test-owned servers shut down after the runs.

The first redirected PowerShell npm runs printed successful test summaries but the
wrapper returned status 1 after treating npm notice output as `NativeCommandError`.
Final npm gates were rerun with native exit status preserved; no assertion or source
change was used to address the wrapper result. Repeated runs are not counted as new
independent coverage. No fresh real-backend smoke or manual zoom audit is claimed.

### Remaining limitations and deferred work

- Live Development Swagger was unavailable during 2Q (`api:check` received connection
  refused at localhost:5231). Generated declarations and accepted backend source were
  compared read-only; no fresh live drift verdict is claimed. No protected backend was
  started or migrated to obtain Swagger.
- The protected database's last recorded state remains 24 listings/14 migrations,
  versus 21 accepted migrations. Its future upgrade/data review needs separate backend
  authorization. No fresh database query was performed in 2Q.
- Obtain the backend provenance fix's post-commit full-suite evidence; the available
  pre-commit runs cannot establish that particular Git-sensitive gate.
- C2-06, FE-TOOL-01 and inherited backend cryptography dependency advisories remain in
  the quality handoff. No dependency update or security exploitability claim is made.
- Production image optimization intentionally rejects loopback/private-IP sources.
  Fixture image success in development and secure fallback in production are distinct
  checks; `dangerouslyAllowLocalIP` remains false.
- Listing details, advanced filters/sorting, richer media, authentication and the other
  non-goals in section 14 remain deferred. Closeout starts none of them.
