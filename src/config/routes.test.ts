import { describe, expect, it } from "vitest";

import { getEquivalentLocalePath, routes } from "./routes";

describe("locale-aware routes", () => {
  it("prefixes every supported user-facing route", () => {
    expect(routes.home("mk")).toBe("/mk");
    expect(routes.listings("en")).toBe("/en/listings");
    expect(routes.listingDetails("mk", "listing-1")).toBe(
      "/mk/listings/listing-1"
    );
    expect(routes.agencyProfile("en", "agency-one")).toBe(
      "/en/agencies/agency-one"
    );
  });

  it("trims and encodes route parameters", () => {
    expect(routes.listingDetails("en", " listing/one? ")).toBe(
      "/en/listings/listing%2Fone%3F"
    );
    expect(routes.agencyProfile("mk", " Агенција Центар ")).toBe(
      "/mk/agencies/%D0%90%D0%B3%D0%B5%D0%BD%D1%86%D0%B8%D1%98%D0%B0%20%D0%A6%D0%B5%D0%BD%D1%82%D0%B0%D1%80"
    );
  });

  it.each(["", "   "])("rejects empty route parameter %j", (value) => {
    expect(() => routes.listingDetails("mk", value)).toThrow(TypeError);
    expect(() => routes.agencyProfile("en", value)).toThrow(TypeError);
  });

  it("replaces an existing locale and preserves normalized query parameters", () => {
    const searchParams = new URLSearchParams();
    searchParams.append("city", "Скопје");
    searchParams.append("type", "Apartment");
    searchParams.append("type", "House");

    expect(getEquivalentLocalePath("en", "/mk/listings", searchParams)).toBe(
      "/en/listings?city=%D0%A1%D0%BA%D0%BE%D0%BF%D1%98%D0%B5&type=Apartment&type=House"
    );
  });

  it("prefixes an unprefixed path and normalizes a query string", () => {
    expect(
      getEquivalentLocalePath("mk", "/listings", "?page=2&city=Skopje")
    ).toBe("/mk/listings?page=2&city=Skopje");
    expect(getEquivalentLocalePath("en", "/mk")).toBe("/en");
  });

  it.each([
    "https://example.com/listings",
    "//example.com/listings",
    "/listings\\unsafe",
    "/listings?city=Skopje",
    "/listings#results",
  ])("rejects unsafe pathname %s", (pathname) => {
    expect(() => getEquivalentLocalePath("mk", pathname)).toThrow(TypeError);
  });
});
