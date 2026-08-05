import type { components } from "@/contracts/generated/openapi";
import type { Dictionary } from "@/i18n";

type ListingStatus = components["schemas"]["ListingStatus"];
type ListingType = components["schemas"]["ListingType"];
type PropertyType = components["schemas"]["PropertyType"];

export function getListingTypeLabel(
  listingType: ListingType,
  dictionary: Dictionary
) {
  return dictionary.listings.listingTypes[listingType];
}

export function getPropertyTypeLabel(
  propertyType: PropertyType,
  dictionary: Dictionary
) {
  return dictionary.listings.propertyTypes[propertyType];
}

export function getListingStatusLabel(
  status: ListingStatus,
  dictionary: Dictionary
) {
  return dictionary.listings.statuses[status];
}
