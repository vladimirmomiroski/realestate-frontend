import type { operations } from "@/contracts/generated/openapi";
import { routes } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import { serializeQueryParams } from "@/lib/api/query-params";

type ListingsQuery = NonNullable<
  operations["Listings_GetListings"]["parameters"]["query"]
>;

type CatalogFilters = {
  q?: ListingsQuery["q"];
  listingType?: ListingsQuery["listingType"];
  propertyType?: Extract<
    NonNullable<ListingsQuery["propertyType"]>,
    "Apartment" | "House"
  >;
};

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;
type InvalidKeyword = {
  reason: "repeated" | "too-short" | "too-long";
  value: string | readonly string[];
};

export type PublicListingsSearchState = {
  filters: CatalogFilters;
  page: number;
} & ({ kind: "valid" } | { kind: "invalid-q"; invalidQ: InvalidKeyword });

const maxPage = 2_147_483_647;

function parsePage(value: SearchParams["page"]): number {
  if (typeof value !== "string" || !/^[0-9]+$/.test(value)) {
    return 1;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= maxPage ? page : 1;
}

export function parsePublicListingsSearchParams(
  params: SearchParams
): PublicListingsSearchState {
  const filters: CatalogFilters = {};
  const page = parsePage(params.page);
  const rawQ = params.q;
  let invalidQ: InvalidKeyword | undefined;

  if (Array.isArray(rawQ)) {
    invalidQ = { reason: "repeated", value: rawQ };
  } else if (typeof rawQ === "string") {
    const q = rawQ.trim();

    if (q.length === 1) {
      invalidQ = { reason: "too-short", value: rawQ };
    } else if (q.length > 100) {
      invalidQ = { reason: "too-long", value: rawQ };
    } else if (q) {
      filters.q = q;
    }
  }

  if (params.listingType === "Sale" || params.listingType === "Rent") {
    filters.listingType = params.listingType;
  }

  if (params.propertyType === "Apartment" || params.propertyType === "House") {
    filters.propertyType = params.propertyType;
  }

  return invalidQ
    ? { kind: "invalid-q", filters, page, invalidQ }
    : { kind: "valid", filters, page };
}

export function toPublicListingsQuery(
  state: Extract<PublicListingsSearchState, { kind: "valid" }>
): Pick<ListingsQuery, "q" | "listingType" | "propertyType" | "page"> {
  return { ...state.filters, ...(state.page > 1 ? { page: state.page } : {}) };
}

function catalogUrl(locale: Locale, filters: CatalogFilters, page?: number) {
  const normalized = parsePublicListingsSearchParams(filters);

  if (normalized.kind === "invalid-q") {
    throw new RangeError("Invalid catalog keyword");
  }

  if (
    page !== undefined &&
    (!Number.isSafeInteger(page) || page < 1 || page > maxPage)
  ) {
    throw new RangeError("Invalid catalog page");
  }

  const query = serializeQueryParams({
    ...normalized.filters,
    page: page && page > 1 ? page : undefined,
  });

  return `${routes.listings(locale)}${query ? `?${query}` : ""}`;
}

export function publicListingsFilterUrl(
  locale: Locale,
  filters: CatalogFilters
) {
  return catalogUrl(locale, filters);
}

export function publicListingsPageUrl(
  locale: Locale,
  state: Extract<PublicListingsSearchState, { kind: "valid" }>,
  page: number
) {
  return catalogUrl(locale, state.filters, page);
}
