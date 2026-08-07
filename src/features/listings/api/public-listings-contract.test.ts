import { describe, expect, it } from "vitest";

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
        city: null,
        municipality: undefined,
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
    });
  });

  it("omits translated card content when no effective translation is returned", () => {
    const card = parsePublicListingsResponse(
      responseWith({
        title: null,
        languageCode: null,
        city: null,
        municipality: null,
        neighborhood: null,
      })
    ).items[0];

    expect(card).not.toHaveProperty("title");
    expect(card).not.toHaveProperty("languageCode");
    expect(card).not.toHaveProperty("city");
    expect(card).not.toHaveProperty("municipality");
    expect(card).not.toHaveProperty("neighborhood");
  });

  it("does not impose correlations among optional translated fields", () => {
    const withoutTitle = parsePublicListingsResponse(
      responseWith({
        title: null,
        languageCode: "mk",
        city: "Скопје",
      })
    ).items[0];
    const withoutLanguageCode = parsePublicListingsResponse(
      responseWith({
        title: "Стан во Центар",
        languageCode: null,
      })
    ).items[0];
    const locationOnly = parsePublicListingsResponse(
      responseWith({
        title: null,
        languageCode: null,
        municipality: "Центар",
        neighborhood: "Капиштец",
      })
    ).items[0];

    expect(withoutTitle).toMatchObject({
      languageCode: "mk",
      city: "Скопје",
    });
    expect(withoutTitle).not.toHaveProperty("title");
    expect(withoutLanguageCode).toMatchObject({ title: "Стан во Центар" });
    expect(withoutLanguageCode).not.toHaveProperty("languageCode");
    expect(locationOnly).toMatchObject({
      municipality: "Центар",
      neighborhood: "Капиштец",
    });
    expect(locationOnly).not.toHaveProperty("title");
    expect(locationOnly).not.toHaveProperty("languageCode");
  });

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
      responseWith({ languageCode: "sq" })
    ).items[0];

    expect(card?.languageCode).toBe("sq");
  });

  it.each([
    ["missing id", { id: undefined }],
    ["malformed id", { id: "not-a-uuid" }],
    ["unknown listing type", { listingType: "Exchange" }],
    ["unknown property type", { propertyType: "Land" }],
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
