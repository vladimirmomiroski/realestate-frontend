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

  it("renders the backend total independently of current-page items", async () => {
    vi.mocked(getPublicListings).mockResolvedValueOnce({
      items: [],
      page: 2,
      pageSize: 20,
      totalCount: 24,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    render(
      await ListingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ page: "2" }),
      })
    );

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: { page: 2 },
    });
    const results = screen.getByRole("region", { name: "Results" });
    expect(results).toHaveTextContent("24 properties found");
    expect(results.querySelectorAll("article")).toHaveLength(0);
  });

  it("passes normalized selections to the form and server query", async () => {
    const page = await ListingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        q: " Family ",
        listingType: "Rent",
        propertyType: "House",
        page: "2",
        lang: "mk",
      }),
    });
    render(page);

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: {
        q: "Family",
        listingType: "Rent",
        propertyType: "House",
        page: 2,
      },
    });
    expect(screen.getByRole("searchbox")).toHaveValue("Family");
    expect(screen.getByRole("combobox", { name: "Listing type" })).toHaveValue(
      "Rent"
    );
    expect(screen.getByRole("combobox", { name: "Property type" })).toHaveValue(
      "House"
    );
    expect(screen.getByRole("link", { name: "Reset" })).toHaveAttribute(
      "href",
      "/en/listings"
    );
  });

  it("normalizes unsupported or repeated filter values before querying", async () => {
    const page = await ListingsPage({
      params: Promise.resolve({ locale: "mk" }),
      searchParams: Promise.resolve({
        listingType: ["Sale", "Rent"],
        propertyType: "Land",
      }),
    });
    render(page);

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "mk",
      query: {},
    });
    expect(screen.getByRole("combobox", { name: "Тип на оглас" })).toHaveValue(
      ""
    );
    expect(screen.getByRole("combobox", { name: "Тип на имот" })).toHaveValue(
      ""
    );
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
