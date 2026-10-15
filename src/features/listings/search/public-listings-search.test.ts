import { describe, expect, it } from "vitest";

import {
  parsePublicListingsSearchParams,
  publicListingsFilterUrl,
  publicListingsPageUrl,
  toPublicListingsQuery,
} from "./public-listings-search";

type SearchParams = Record<string, string | string[] | undefined>;

function validSearch(params: SearchParams = {}) {
  const state = parsePublicListingsSearchParams(params);

  if (state.kind !== "valid") {
    throw new Error("Expected valid catalog search state");
  }

  return state;
}

describe("public listings search state", () => {
  it("defaults to page one and ignores unknown URL keys", () => {
    const state = validSearch({ lang: "mk", sort: "oldest", pageSize: "99" });

    expect(state).toEqual({ kind: "valid", filters: {}, page: 1 });
    expect(toPublicListingsQuery(state)).toEqual({});
  });

  it("trims a valid keyword and accepts both exact length boundaries", () => {
    expect(validSearch({ q: "  Skopje  " }).filters.q).toBe("Skopje");
    expect(validSearch({ q: "ab" }).filters.q).toBe("ab");
    expect(validSearch({ q: "a".repeat(100) }).filters.q).toBe("a".repeat(100));
    expect(validSearch({ q: " \t " }).filters).toEqual({});
  });

  it.each([
    { q: " x ", reason: "too-short" },
    { q: "x".repeat(101), reason: "too-long" },
  ] as const)("retains invalid $reason keyword state", ({ q, reason }) => {
    expect(parsePublicListingsSearchParams({ q })).toMatchObject({
      kind: "invalid-q",
      filters: {},
      invalidQ: { reason, value: q },
    });
  });

  it("rejects repeated keywords without selecting an arbitrary value", () => {
    const values = ["Skopje", "Bitola"];

    expect(parsePublicListingsSearchParams({ q: values })).toMatchObject({
      kind: "invalid-q",
      filters: {},
      invalidQ: { reason: "repeated", value: values },
    });
    expect(parsePublicListingsSearchParams({ q: ["Skopje"] }).kind).toBe(
      "invalid-q"
    );
  });

  it("accepts the compact Chapter 2 enums and combines valid state", () => {
    const state = validSearch({
      q: "  Skopje & Centar  ",
      listingType: "Rent",
      propertyType: "House",
      page: "3",
      lang: "mk",
      agencyId: "untrusted",
    });

    expect(state).toEqual({
      kind: "valid",
      filters: {
        q: "Skopje & Centar",
        listingType: "Rent",
        propertyType: "House",
      },
      page: 3,
    });
    expect(toPublicListingsQuery(state)).toEqual({
      q: "Skopje & Centar",
      listingType: "Rent",
      propertyType: "House",
      page: 3,
    });
    expect(validSearch({ listingType: "Sale" }).filters.listingType).toBe(
      "Sale"
    );
    expect(
      validSearch({ propertyType: "Apartment" }).filters.propertyType
    ).toBe("Apartment");
  });

  it("drops unsupported and repeated enum selections", () => {
    expect(
      validSearch({
        listingType: "Auction",
        propertyType: "Commercial",
      }).filters
    ).toEqual({});
    expect(
      validSearch({
        listingType: ["Sale", "Rent"],
        propertyType: ["Apartment", "House"],
      }).filters
    ).toEqual({});
    expect(validSearch({ propertyType: "Land" }).filters).toEqual({});
  });

  it.each(["1", "2", "0003", "2147483647"])(
    "accepts positive base-10 page %s",
    (page) => {
      const state = validSearch({ page });
      expect(state.page).toBe(Number(page));
      expect(toPublicListingsQuery(state).page).toBe(
        Number(page) === 1 ? undefined : Number(page)
      );
    }
  );

  it.each([
    "0",
    "-1",
    "+2",
    "1.5",
    "1e2",
    " 2 ",
    "abc",
    "2147483648",
    "9".repeat(100),
    ["2", "3"],
  ])("normalizes invalid page %j to one", (page) => {
    expect(validSearch({ page }).page).toBe(1);
  });
});

describe("catalog URLs", () => {
  it("uses localized routes and omits absent or default state", () => {
    expect(publicListingsFilterUrl("mk", {})).toBe("/mk/listings");
    expect(publicListingsPageUrl("en", validSearch(), 1)).toBe("/en/listings");
  });

  it("encodes and orders only supported normalized filters", () => {
    const state = validSearch({
      q: " Скопје & Центар ",
      listingType: "Rent",
      propertyType: "Apartment",
      unknown: "discard",
      lang: "en",
    });
    const href = publicListingsFilterUrl("mk", state.filters);

    expect(href).toMatch(
      /^\/mk\/listings\?listingType=Rent&propertyType=Apartment&q=/
    );
    expect(href).toContain("%26");
    expect(new URL(href, "https://example.test").searchParams.get("q")).toBe(
      "Скопје & Центар"
    );
    expect(href).not.toContain("unknown");
    expect(href).not.toContain("lang=");
  });

  it("preserves valid filters for paging and resets page when filters change", () => {
    const state = validSearch({ q: "Skopje", listingType: "Sale", page: "4" });

    expect(publicListingsPageUrl("en", state, 5)).toBe(
      "/en/listings?listingType=Sale&page=5&q=Skopje"
    );
    expect(
      publicListingsFilterUrl("en", {
        ...state.filters,
        listingType: "Rent",
      })
    ).toBe("/en/listings?listingType=Rent&q=Skopje");
  });

  it("uses canonical first and second page URLs without leaking unsupported state", () => {
    expect(publicListingsPageUrl("en", validSearch(), 2)).toBe(
      "/en/listings?page=2"
    );

    const state = validSearch({
      q: " Family ",
      listingType: ["Sale", "Rent"],
      propertyType: "Commercial",
      lang: "mk",
      pageSize: "99",
      sort: "oldest",
      page: "3",
    });
    expect(publicListingsPageUrl("en", state, 2)).toBe(
      "/en/listings?page=2&q=Family"
    );
    expect(publicListingsPageUrl("mk", state, 1)).toBe("/mk/listings?q=Family");
  });

  it("does not construct URLs from invalid keyword or page values", () => {
    expect(() => publicListingsFilterUrl("en", { q: "x" })).toThrow(RangeError);
    expect(() => publicListingsPageUrl("en", validSearch(), 2.5)).toThrow(
      RangeError
    );
    expect(() =>
      publicListingsPageUrl("en", validSearch(), 2147483648)
    ).toThrow(RangeError);
  });
});
