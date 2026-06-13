<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — RealEstate Frontend Instructions

## Project

This repository is the frontend for a real estate platform for North Macedonia.

The backend foundation already exists in the separate `realestate-backend` repository.

Do not invent backend endpoints. Use the existing backend API contract unless explicitly asked to change it.

---

## Current frontend stack

- Next.js
- TypeScript
- App Router
- Route groups
- i18n foundation
- Theme system
- Shared components
- Feature-based structure

Always inspect existing files before adding new structure.

---

## Current structure

```text
src/
  app/
    (admin)/
    (auth)/
    (dashboard)/
    (public)/
      listings/
        page.tsx
    favicon.ico
    globals.css
    layout.tsx

  components/
    shared/
      feedback/
      layout/
      providers/
      theme/
      ui/

  config/
    navigation.ts
    routes.ts
    site.ts

  features/
    admin/
    auth/
    dashboard/
    listings/
      components/
      data/
      hooks/
      services/
      types/
      utils/

  i18n/
    dictionaries/
      en.ts
      mk.ts
      index.ts
    types.ts
    index.ts
    locales.ts

  lib/
    api/
    env/
    utils/

  types/
```

---

## Folder rules

Use `src/app` only for routing/pages/layouts.

Use `src/components/shared` only for reusable app-wide UI.

Examples:

```text
Button
Input
Select
Card
Header
Footer
ThemeToggle
Toast/feedback
```

Use `src/features/listings` for listing-specific logic.

Examples:

```text
ListingCard
ListingsGrid
ListingsFilters
ListingsPagination
listings-service.ts
listing.ts
listing-filters.ts
```

Use `src/lib/api` for generic API infrastructure.

Examples:

```text
api-client.ts
api-config.ts
```

Do not put listing-specific API logic directly in `lib/api`.

Correct split:

```text
src/lib/api/api-client.ts
  generic fetch wrapper

src/features/listings/services/listings-service.ts
  listing-specific backend calls
```

---

## Backend API contract

Backend local URL:

```text
http://localhost:5231
```

Listings endpoint:

```http
GET /api/listings
```

Supported query parameters:

```text
lang
listingType
propertyType
minPrice
maxPrice
city
neighborhood
page
pageSize
```

Example:

```http
GET http://localhost:5231/api/listings?lang=en&page=1&pageSize=20
```

Response shape:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

Single listing endpoint:

```http
GET /api/listings/{id}?lang=en
GET /api/listings/{id}?lang=mk
```

Create listing endpoint exists in backend:

```http
POST /api/listings
```

But frontend MVP should first focus on public listing discovery before seller/admin creation UI.

---

## Listing backend response fields

Listing item shape:

```ts
type Listing = {
  id: string;
  listingType: "Sale" | "Rent";
  propertyType: "Apartment" | "House";
  status: "Draft" | "Active" | "Reserved" | "Sold" | "Rented" | "Archived";
  price: number;
  currency: string;
  areaSquareMeters: number;
  pricePerSquareMeter: number;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  languageCode: string;
  title: string;
  description: string | null;
  addressLine: string | null;
  city: string | null;
  neighborhood: string | null;
};
```

---

## i18n rules

The frontend handles fixed app label translations.

Examples:

```text
Apartment / Стан
House / Куќа
Sale / Продажба
Rent / Изнајмување
```

The backend stores custom listing text translations.

Examples:

```text
title
description
city
neighborhood
addressLine
```

Use existing `src/i18n` structure. Do not replace the i18n system.

---

## First frontend MVP tasks

Start with:

```text
feature/listings-api-client
```

This should add or update:

```text
src/lib/api/api-client.ts
src/features/listings/types/listing.ts
src/features/listings/types/paged-response.ts
src/features/listings/types/listing-filters.ts
src/features/listings/services/listings-service.ts
```

Then:

```text
feature/listings-page
```

Build:

```text
/listings
```

Using:

```text
src/app/(public)/listings/page.tsx
```

Then add:

```text
ListingCard
ListingsGrid
ListingsFilters
ListingsPagination
```

---

## What not to build yet

Do not build these unless explicitly requested:

```text
auth UI
dashboard UI
admin UI
payments
subscriptions
chat
advanced AI
saved searches
favorites
map drawing tools
analytics dashboard
seller upload flow
```

Map view can come after the listing page and filters work.

---

## Development rules

Before finishing a task, run the existing validation commands from `package.json`.

Use the package manager already present in the repo.

Because `package-lock.json` exists, prefer:

```bash
npm install
npm run lint
npm run build
```

If scripts differ, inspect `package.json` first.

---

## AI/Codex rules

Before writing code:

1. Read this file.
2. Inspect existing structure.
3. Read relevant Next.js docs from `node_modules/next/dist/docs/`.
4. Do not restructure the project unless explicitly asked.
5. Do not invent backend endpoints.
6. Keep changes small and task-focused.
7. Follow the existing feature-folder style.
8. Prefer typed API calls and typed response models.
9. Keep shared UI separate from feature-specific UI.
10. Run lint/build before completing work.
