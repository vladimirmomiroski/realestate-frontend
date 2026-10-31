import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/features/listings/api/get-public-listings.server", () => ({
  getPublicListings: vi.fn(),
}));

import { getPublicListings } from "@/features/listings/api/get-public-listings.server";
import { headers } from "next/headers";
import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { generateMetadata } from "./page";

beforeEach(() => {
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Metadata must not fetch")
  );
});

for (const { locale, dictionary } of [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const) {
  describe(`${locale} catalog metadata`, () => {
    const cleanAlternates = {
      canonical: `/${locale}/listings`,
      languages: { mk: "/mk/listings", en: "/en/listings" },
    };

    it("uses localized catalog copy and clean relative URLs with inherited metadataBase", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({}),
      });
      expect(metadata).toEqual({
        title: dictionary.metadata.listings.title,
        description: dictionary.metadata.listings.description,
        alternates: cleanAlternates,
        robots: { index: true, follow: true },
      });
      expect(metadata.title).not.toBe(dictionary.metadata.home.title);
      expect(metadata.description).not.toBe(
        dictionary.metadata.home.description
      );
      expect(getPublicListings).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
      { q: "house" },
      { listingType: "Rent" },
      { propertyType: "Apartment" },
      { page: "2" },
      { page: "1" },
      { q: "" },
      { q: "x" },
      { q: "x".repeat(101) },
      { q: ["house", "flat"] },
      { listingType: "Invalid" },
      { propertyType: "Land" },
      { unknown: "value" },
      { utm_source: "test" },
      { lang: "mk" },
      { q: "Family", listingType: "Rent", propertyType: "House", page: "3" },
    ])("keeps every query-bearing URL noindex/follow: %j", async (query) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve(query),
      });
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates).toEqual(cleanAlternates);
      expect(metadata.title).toBe(dictionary.metadata.listings.title);
      expect(metadata.description).toBe(
        dictionary.metadata.listings.description
      );
      expect(getPublicListings).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("uses Proxy's original query-presence signal when Next loses a special key", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-realestate-catalog-query": "1" })
      );
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({}),
      });
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates).toEqual(cleanAlternates);
      expect(getPublicListings).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });
}

it("uses existing locale validation without requesting listing data", async () => {
  await expect(
    generateMetadata({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve({}),
    })
  ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  expect(getPublicListings).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
