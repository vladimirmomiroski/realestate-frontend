import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/listings/api/get-public-listings.server", () => ({
  getPublicListings: vi.fn(),
}));

import { getPublicListings } from "@/features/listings/api/get-public-listings.server";

import ListingsPage from "./page";

describe("catalog server page URL integration", () => {
  beforeEach(() => {
    vi.mocked(getPublicListings).mockReset();
    vi.mocked(getPublicListings).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it.each(["mk", "en"] as const)(
    "keeps route locale %s authoritative and omits URL-controlled backend fields",
    async (locale) => {
      await ListingsPage({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({
          q: " Skopje ",
          listingType: "Sale",
          propertyType: "House",
          page: "3",
          lang: locale === "mk" ? "en" : "mk",
          pageSize: "99",
          sort: "oldest",
        }),
      });

      expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
        locale,
        query: {
          q: "Skopje",
          listingType: "Sale",
          propertyType: "House",
          page: 3,
        },
      });
    }
  );

  it("keeps the clean URL on the accepted default operation query", async () => {
    const page = await ListingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: {},
    });
    expect(
      screen.getByRole("searchbox", { name: "Keyword or location" })
    ).toHaveValue("");
  });

  it.each([{ q: "x" }, { q: "x".repeat(101) }, { q: ["Skopje", "Bitola"] }])(
    "suppresses the backend request for invalid q $q",
    async (searchParams) => {
      const page = await ListingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve(searchParams),
      });
      render(page);

      expect(getPublicListings).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { level: 1, name: "Listings" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Results" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("searchbox", { name: "Keyword or location" })
      ).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toBeInTheDocument();
    }
  );
});
