import { describe, expect, it } from "vitest";

import {
  formatPrice,
  formatPricePerSquareMeter,
} from "../utils/listing-formatters";

import {
  parsePublicListingsResponse,
  type PublicListingsSuccessBody,
} from "./public-listings-contract";

const listingId = "b1b7479c-bdae-4d3b-9771-3150f96a6cd2";
const validListing = {
  id: listingId,
  listingType: "Sale",
  propertyType: "Apartment",
  status: "Active",
  price: 145_000,
  currency: "EUR",
  areaSquareMeters: 82.5,
  rooms: 3,
  pricePerSquareMeter: 1757.58,
  title: "Стан во Дебар Маало",
  city: "Скопје",
  municipality: "Центар",
  neighborhood: "Дебар Маало",
  languageCode: "mk",
  addressLine: "Example address",
  latitude: 41.9981,
  longitude: 21.4254,
  locationPrecision: "Street",
  primaryImageUrl: "/uploads/listings/primary.webp",
  description: "An unconsumed backend field.",
  bathrooms: 2,
} satisfies PublicListingsSuccessBody["items"][number];

const validResponse = {
  items: [validListing],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
} satisfies PublicListingsSuccessBody;

function responseWith(
  listingOverrides: Record<string, unknown> = {},
  pageOverrides: Record<string, unknown> = {}
) {
  return {
    ...validResponse,
    items: [{ ...validListing, ...listingOverrides }],
    ...pageOverrides,
  };
}

describe("parsePublicListingsResponse", () => {
  it.each([
    "euros",
    "",
    "EU",
    "EURO",
    "€",
    "EU1",
    "ЕUR",
    " EUR",
    "EUR ",
    "EUR\n",
    "u$d",
  ])("rejects malformed currency %j before formatting", (currency) => {
    expect(() =>
      parsePublicListingsResponse(responseWith({ currency }))
    ).toThrow("Invalid public listings response at items[0].currency.");
  });

  it.each(["EUR", "MKD", "XAU", "XTS", "ZZZ", "eur"])(
    "preserves syntactically valid currency %s and safely formats it in both locales",
    (currency) => {
      const card = parsePublicListingsResponse(responseWith({ currency }))
        .items[0]!;
      expect(card.currency).toBe(currency);
      for (const locale of ["mk", "en"] as const) {
        expect(formatPrice(card.price, card.currency, locale)).toBeTruthy();
        expect(
          formatPricePerSquareMeter(
            card.pricePerSquareMeter,
            card.currency,
            locale
          )
        ).toBeTruthy();
      }
    }
  );

  it("maps a representative generated success page into the narrow card model", () => {
    expect(parsePublicListingsResponse(validResponse)).toEqual({
      items: [
        {
          id: listingId,
          listingType: "Sale",
          propertyType: "Apartment",
          price: 145_000,
          currency: "EUR",
          areaSquareMeters: 82.5,
          rooms: 3,
          pricePerSquareMeter: 1757.58,
          title: "Стан во Дебар Маало",
          city: "Скопје",
          municipality: "Центар",
          neighborhood: "Дебар Маало",
          languageCode: "mk",
          primaryImageUrl: "/uploads/listings/primary.webp",
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("omits nullable optional card fields", () => {
    const result = parsePublicListingsResponse(
      responseWith({
        rooms: null,
        pricePerSquareMeter: undefined,
        neighborhood: null,
        primaryImageUrl: undefined,
      })
    );

    expect(result.items[0]).toEqual({
      id: listingId,
      listingType: "Sale",
      propertyType: "Apartment",
      price: 145_000,
      currency: "EUR",
      areaSquareMeters: 82.5,
      title: "Стан во Дебар Маало",
      languageCode: "mk",
      city: validListing.city,
      municipality: validListing.municipality,
    });
  });

  it.each(["Apartment", "House", "Commercial", "Land"] as const)(
    "accepts the %s property root",
    (propertyType) => {
      const card = parsePublicListingsResponse(responseWith({ propertyType }))
        .items[0];

      expect(card?.propertyType).toBe(propertyType);
    }
  );

  it.each([
    "title",
    "languageCode",
    "city",
    "municipality",
    "addressLine",
    "description",
  ])("rejects missing, null, and blank required %s", (field) => {
    for (const value of [undefined, null, "  "]) {
      expect(() =>
        parsePublicListingsResponse(responseWith({ [field]: value }))
      ).toThrow(TypeError);
    }
  });

  it.each(["latitude", "longitude"])(
    "rejects missing, null, and non-finite required %s",
    (field) => {
      for (const value of [undefined, null, "42", Number.NaN, Infinity]) {
        expect(() =>
          parsePublicListingsResponse(responseWith({ [field]: value }))
        ).toThrow(TypeError);
      }
    }
  );

  it.each([
    ["latitude", -90.0001],
    ["latitude", 90.0001],
    ["longitude", -180.0001],
    ["longitude", 180.0001],
  ])("rejects out-of-range %s %s", (field, value) => {
    expect(() =>
      parsePublicListingsResponse(responseWith({ [field]: value }))
    ).toThrow(`Invalid public listings response at items[0].${field}.`);
  });

  it.each([
    [0, 0],
    [-90, -180],
    [90, 180],
    [-45, -75],
  ])("accepts valid coordinates %s, %s", (latitude, longitude) => {
    expect(
      parsePublicListingsResponse(responseWith({ latitude, longitude })).items
    ).toHaveLength(1);
  });

  it.each([undefined, null, "", "Unknown"])(
    "rejects invalid required location precision %s",
    (locationPrecision) => {
      expect(() =>
        parsePublicListingsResponse(responseWith({ locationPrecision }))
      ).toThrow(TypeError);
    }
  );

  it("accepts a positive out-of-range page without requiring page <= totalPages", () => {
    expect(
      parsePublicListingsResponse({
        ...validResponse,
        items: [],
        page: 5,
        totalCount: 21,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      })
    ).toEqual({
      items: [],
      page: 5,
      pageSize: 20,
      totalCount: 21,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it("accepts valid page sizes other than the later request-policy default", () => {
    expect(
      parsePublicListingsResponse({
        ...validResponse,
        pageSize: 1,
      }).pageSize
    ).toBe(1);
  });

  it("ignores unrelated wire fields instead of exposing them", () => {
    const card = parsePublicListingsResponse(
      responseWith({
        addressLine: "Backend address",
        images: [{ id: listingId, url: "/uploads/listings/other.webp" }],
        customFutureField: "ignored",
      })
    ).items[0];

    expect(card).not.toHaveProperty("description");
    expect(card).not.toHaveProperty("bathrooms");
    expect(card).not.toHaveProperty("addressLine");
    expect(card).not.toHaveProperty("images");
    expect(card).not.toHaveProperty("customFutureField");
  });

  it("preserves the returned languageCode without frontend fallback", () => {
    const card = parsePublicListingsResponse(
      responseWith({
        languageCode: "sq",
        title: "Backend fallback title",
        city: "Backend fallback city",
      })
    ).items[0];

    expect(card).toMatchObject({
      languageCode: "sq",
      title: "Backend fallback title",
      city: "Backend fallback city",
    });
  });

  it("accepts nullable root details without adding them to the card", () => {
    const card = parsePublicListingsResponse(
      responseWith({
        propertyType: "Commercial",
        apartmentDetails: null,
        houseDetails: null,
        commercialDetails: null,
        landDetails: null,
      })
    ).items[0];

    expect(card?.propertyType).toBe("Commercial");
    expect(card).not.toHaveProperty("commercialDetails");
  });

  it.each([
    ["missing id", { id: undefined }],
    ["malformed id", { id: "not-a-uuid" }],
    ["unknown listing type", { listingType: "Exchange" }],
    ["unknown property type", { propertyType: "Warehouse" }],
    ["non-finite price", { price: Number.NaN }],
    ["negative price", { price: -1 }],
    ["non-finite area", { areaSquareMeters: Number.POSITIVE_INFINITY }],
    ["negative area", { areaSquareMeters: -1 }],
    ["invalid rooms", { rooms: -1 }],
    ["invalid price per square metre", { pricePerSquareMeter: -1 }],
  ])("rejects %s", (_name, listingOverrides) => {
    expect(() =>
      parsePublicListingsResponse(responseWith(listingOverrides))
    ).toThrow(TypeError);
  });

  it.each(["Draft", "Reserved", "Sold", "Rented", "Archived"])(
    "rejects non-Active status %s",
    (status) => {
      expect(() =>
        parsePublicListingsResponse(responseWith({ status }))
      ).toThrow(TypeError);
    }
  );

  it.each([
    ["missing page", { page: undefined }],
    ["zero page", { page: 0 }],
    ["fractional page", { page: 1.5 }],
    ["zero page size", { pageSize: 0 }],
    ["oversized page size", { pageSize: 101 }],
    ["negative total count", { totalCount: -1 }],
    ["negative total pages", { totalPages: -1 }],
    ["inconsistent total pages", { totalPages: 2, hasNextPage: true }],
    ["inconsistent next flag", { hasNextPage: true }],
    ["inconsistent previous flag", { hasPreviousPage: true }],
  ])("rejects invalid page metadata: %s", (_name, pageOverrides) => {
    expect(() =>
      parsePublicListingsResponse(responseWith({}, pageOverrides))
    ).toThrow(TypeError);
  });

  it.each([
    null,
    [],
    {},
    { ...validResponse, items: null },
    responseWith({ title: 42 }),
    responseWith({ currency: "" }),
    responseWith({ languageCode: 42 }),
    responseWith({ city: 42 }),
  ])("rejects a malformed consumed success body", (body) => {
    expect(() => parsePublicListingsResponse(body)).toThrow(TypeError);
  });
});
