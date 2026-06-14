import { apiGet } from "@/lib/api/api-client";
import { defaultLocale, type Locale } from "@/i18n/locales";
import type { Listing } from "../types/listing";
import type { ListingFilters } from "../types/listing-filters";
import type { PagedResponse } from "../types/paged-response";

export function getListings(filters: ListingFilters = {}) {
  return apiGet<PagedResponse<Listing>>("/api/listings", {
    query: { ...filters, lang: filters.lang ?? defaultLocale },
  });
}

export function getListingById(id: string, lang: Locale = defaultLocale) {
  return apiGet<Listing>(`/api/listings/${encodeURIComponent(id)}`, {
    query: { lang },
  });
}
