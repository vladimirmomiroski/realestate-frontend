# RealEstate Frontend Context

## Project purpose

This frontend is for a real estate discovery platform for North Macedonia.

The first frontend goal is to consume the already-built backend API and create a clean public listing discovery experience.

The MVP should focus on:

- public listings page
- listing cards
- search/filter UI
- pagination
- listing details page
- price per square meter display
- Macedonian/English support

Do not start with auth, dashboard, admin, payments, or advanced AI.

---

## Current frontend status

Completed frontend setup:

- Next.js project
- scalable project structure
- developer tooling
- app configuration
- theme system
- theme toggle
- i18n foundation

Current major folders:

```text
src/app
src/components/shared
src/config
src/features
src/i18n
src/lib
src/types
```

---

## Current frontend route structure

The app uses route groups:

```text
src/app/(public)
src/app/(auth)
src/app/(dashboard)
src/app/(admin)
```

The current public listings route is:

```text
src/app/(public)/listings/page.tsx
```

This maps to:

```text
/listings
```

Future listing details route should be:

```text
src/app/(public)/listings/[id]/page.tsx
```

This maps to:

```text
/listings/{id}
```

---

## Shared vs feature-specific rule

Use shared components only for reusable UI.

Shared examples:

```text
src/components/shared/ui/Button
src/components/shared/ui/Input
src/components/shared/ui/Card
src/components/shared/layout/Header
src/components/shared/theme/ThemeToggle
```

Use listing feature folder for listing-specific UI and logic.

Listing examples:

```text
src/features/listings/components/ListingCard
src/features/listings/components/ListingsGrid
src/features/listings/components/ListingsFilters
src/features/listings/components/ListingsPagination
src/features/listings/services/listings-service.ts
src/features/listings/types/listing.ts
src/features/listings/hooks/useListings.ts
```

---

## API structure decision

Use:

```text
src/lib/api
```

for generic API infrastructure.

Example:

```text
src/lib/api/api-client.ts
```

Use:

```text
src/features/listings/services
```

for listing-specific API calls.

Example:

```text
src/features/listings/services/listings-service.ts
```

Mental model:

```text
page.tsx
  ↓
features/listings/services/listings-service.ts
  ↓
lib/api/api-client.ts
  ↓
ASP.NET backend
```

---

## Backend status

Backend foundation is complete and merged into main.

Backend includes:

- PostgreSQL
- EF Core
- Clean Architecture
- Listing domain model
- Listing translations
- Listing create/read endpoints
- Filtering and pagination
- Auditing fields
- Integration tests
- CORS support for frontend localhost
- Backend context docs
- Backend AGENTS.md

Backend should not be expanded unless frontend needs a backend change.

---

## Backend local API

Backend local base URL:

```text
http://localhost:5231
```

Listings endpoint:

```http
GET /api/listings
```

Example:

```http
GET http://localhost:5231/api/listings?lang=en&page=1&pageSize=20
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

Pagination rules:

```text
default page = 1
default pageSize = 20
max pageSize = 100
```

---

## Paged listings response

```ts
type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
```

Example JSON:

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

---

## Listing response

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

## Single listing endpoint

```http
GET /api/listings/{id}?lang=en
GET /api/listings/{id}?lang=mk
```

Returns one listing.

If requested language is missing, backend falls back to first available translation.

---

## First frontend coding task

Task name:

```text
feature/listings-api-client
```

Goal:

Create typed API access for listing endpoints.

Expected files:

```text
src/lib/api/api-client.ts
src/features/listings/types/listing.ts
src/features/listings/types/paged-response.ts
src/features/listings/types/listing-filters.ts
src/features/listings/services/listings-service.ts
```

Do not build UI before the API client/types are clean.

---

## Second frontend coding task

Task name:

```text
feature/listings-page
```

Goal:

Build the public listings page using backend data.

Expected route:

```text
src/app/(public)/listings/page.tsx
```

Expected components:

```text
src/features/listings/components/ListingCard.tsx
src/features/listings/components/ListingsGrid.tsx
src/features/listings/components/ListingsFilters.tsx
src/features/listings/components/ListingsPagination.tsx
```

---

## Product direction

MVP public side should include:

- homepage
- listing results
- filters
- listing cards
- listing details
- price per square meter
- map later

Do not start with:

- admin dashboard
- auth
- seller upload
- payments
- subscriptions
- advanced AI
- CRM features

---

## Development commands

Use existing scripts from `package.json`.

Because `package-lock.json` exists, prefer npm.

Common commands are likely:

```bash
npm install
npm run lint
npm run build
```

Inspect `package.json` before assuming exact scripts.

---

## Notes for future chat

The backend is ready.

The next frontend work should not start by redesigning architecture.

Start by connecting the frontend to the backend listings API using typed services.
