import type { Locale } from "@/i18n/locales";
import type { ListingType, PropertyType } from "./listing";

export type ListingFilters = {
  lang?: Locale;
  listingType?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  neighborhood?: string;
  page?: number;
  pageSize?: number;
};
