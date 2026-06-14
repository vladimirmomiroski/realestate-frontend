import type { Dictionary } from "@/i18n";
import type {
  ListingStatus,
  ListingType,
  PropertyType,
} from "../types/listing";

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
