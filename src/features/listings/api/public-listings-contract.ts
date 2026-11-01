import type { operations } from "@/contracts/generated/openapi";
import type { Page } from "@/lib/api/page";

import type { PublicListingCard } from "../model/public-listing-card";

export type PublicListingsSuccessBody =
  operations["Listings_GetListings"]["responses"][200]["content"]["application/json"];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalid(path: string): never {
  throw new TypeError(`Invalid public listings response at ${path}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    invalid(path);
  }

  return value;
}

function readString(value: unknown, path: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(path);
  }

  return value;
}

function readNumber(value: unknown, path: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    invalid(path);
  }

  return value;
}

function readCurrency(value: unknown, path: string) {
  if (
    typeof value !== "string" ||
    value.length !== 3 ||
    !/^[A-Za-z]{3}$/.test(value)
  ) {
    invalid(path);
  }

  return value;
}

function readCoordinate(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid(path);
  }

  return value;
}

function readInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER
) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid(path);
  }

  return value;
}

function readBoolean(value: unknown, path: string) {
  if (typeof value !== "boolean") {
    invalid(path);
  }

  return value;
}

function readOptional<T>(
  value: unknown,
  path: string,
  read: (candidate: unknown, candidatePath: string) => T
) {
  return value === null || value === undefined ? undefined : read(value, path);
}

function readListingType(value: unknown, path: string) {
  if (value !== "Sale" && value !== "Rent") {
    invalid(path);
  }

  return value;
}

function readPropertyType(value: unknown, path: string) {
  if (
    value !== "Apartment" &&
    value !== "House" &&
    value !== "Commercial" &&
    value !== "Land"
  ) {
    invalid(path);
  }

  return value;
}

function readLocationPrecision(value: unknown, path: string) {
  if (
    value !== "ExactAddress" &&
    value !== "Street" &&
    value !== "Neighborhood" &&
    value !== "Municipality" &&
    value !== "City" &&
    value !== "Approximate"
  ) {
    invalid(path);
  }

  return value;
}

function mapListing(value: unknown, index: number): PublicListingCard {
  const path = `items[${index}]`;
  const listing = readRecord(value, path);
  const id = readString(listing.id, `${path}.id`);

  if (!uuidPattern.test(id)) {
    invalid(`${path}.id`);
  }

  if (listing.status !== "Active") {
    invalid(`${path}.status`);
  }

  const rooms = readOptional(listing.rooms, `${path}.rooms`, readNumber);
  const pricePerSquareMeter = readOptional(
    listing.pricePerSquareMeter,
    `${path}.pricePerSquareMeter`,
    readNumber
  );
  const title = readString(listing.title, `${path}.title`);
  const languageCode = readString(listing.languageCode, `${path}.languageCode`);
  const city = readString(listing.city, `${path}.city`);
  const municipality = readString(listing.municipality, `${path}.municipality`);
  readString(listing.addressLine, `${path}.addressLine`);
  readString(listing.description, `${path}.description`);
  readCoordinate(listing.latitude, `${path}.latitude`, -90, 90);
  readCoordinate(listing.longitude, `${path}.longitude`, -180, 180);
  readLocationPrecision(listing.locationPrecision, `${path}.locationPrecision`);
  const neighborhood = readOptional(
    listing.neighborhood,
    `${path}.neighborhood`,
    readString
  );
  const primaryImageUrl = readOptional(
    listing.primaryImageUrl,
    `${path}.primaryImageUrl`,
    readString
  );
  return {
    id,
    listingType: readListingType(listing.listingType, `${path}.listingType`),
    propertyType: readPropertyType(
      listing.propertyType,
      `${path}.propertyType`
    ),
    price: readNumber(listing.price, `${path}.price`),
    currency: readCurrency(listing.currency, `${path}.currency`),
    areaSquareMeters: readNumber(
      listing.areaSquareMeters,
      `${path}.areaSquareMeters`
    ),
    title,
    languageCode,
    city,
    municipality,
    ...(rooms === undefined ? {} : { rooms }),
    ...(pricePerSquareMeter === undefined ? {} : { pricePerSquareMeter }),
    ...(neighborhood === undefined ? {} : { neighborhood }),
    ...(primaryImageUrl === undefined ? {} : { primaryImageUrl }),
  };
}

export function parsePublicListingsResponse(
  value: unknown
): Page<PublicListingCard> {
  const response = readRecord(value, "response");

  if (!Array.isArray(response.items)) {
    invalid("items");
  }

  const page = readInteger(response.page, "page", 1);
  const pageSize = readInteger(response.pageSize, "pageSize", 1, 100);
  const totalCount = readInteger(response.totalCount, "totalCount", 0);
  const totalPages = readInteger(response.totalPages, "totalPages", 0);
  const hasNextPage = readBoolean(response.hasNextPage, "hasNextPage");
  const hasPreviousPage = readBoolean(
    response.hasPreviousPage,
    "hasPreviousPage"
  );

  if (
    totalPages !== Math.ceil(totalCount / pageSize) ||
    hasNextPage !== page < totalPages ||
    hasPreviousPage !== page > 1 ||
    response.items.length > pageSize ||
    (page > totalPages && response.items.length > 0)
  ) {
    invalid("pagination");
  }

  return {
    items: response.items.map(mapListing),
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
