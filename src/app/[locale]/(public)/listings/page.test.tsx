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
    expect(
      screen.getByRole("heading", { level: 2, name: "No properties available" })
    ).toBeInTheDocument();
  });

  it.each([
    {
      searchParams: { listingType: "Rent" },
      page: 1,
      filtered: true,
      query: { listingType: "Rent" },
    },
    {
      searchParams: { q: " Family ", page: "4" },
      page: 4,
      filtered: true,
      query: { q: "Family", page: 4 },
    },
    {
      searchParams: { propertyType: "Land", page: "4", lang: "mk" },
      page: 4,
      filtered: false,
      query: { page: 4 },
    },
  ])(
    "prioritizes zero total on page $page with filtered=$filtered",
    async ({ searchParams, page, filtered, query }) => {
      vi.mocked(getPublicListings).mockResolvedValueOnce({
        items: [],
        page,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: page > 1,
      });
      render(
        await ListingsPage({
          params: Promise.resolve({ locale: "en" }),
          searchParams: Promise.resolve(searchParams),
        })
      );

      expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
        locale: "en",
        query,
      });
      expect(screen.getByRole("region", { name: "Results" })).toHaveTextContent(
        "0 properties found"
      );
      const empty = screen.getByRole("region", {
        name: filtered ? "No matching properties" : "No properties available",
      });
      if (filtered) {
        expect(empty.querySelector("a")).toHaveAttribute(
          "href",
          "/en/listings"
        );
      } else {
        expect(empty.querySelector("a")).toBeNull();
      }
      expect(
        screen.queryByRole("navigation", { name: "Result pages" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Return to the first page" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "No results on this page" })
      ).not.toBeInTheDocument();
    }
  );

  it("renders the backend total independently of current-page items", async () => {
    vi.mocked(getPublicListings).mockResolvedValueOnce({
      items: [],
      page: 3,
      pageSize: 20,
      totalCount: 24,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    render(
      await ListingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ page: "3" }),
      })
    );

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: { page: 3 },
    });
    const results = screen.getByRole("region", { name: "Results" });
    expect(results).toHaveTextContent("24 properties found");
    expect(results.querySelectorAll("article")).toHaveLength(0);
    expect(
      screen.getByRole("heading", { level: 2, name: "No results on this page" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to the first page" })
    ).toHaveAttribute("href", "/en/listings");
    expect(
      screen.queryByRole("navigation", { name: "Result pages" })
    ).not.toBeInTheDocument();
  });

  it("preserves normalized filters for empty-page recovery without another retrieval", async () => {
    vi.mocked(getPublicListings).mockResolvedValueOnce({
      items: [],
      page: 5,
      pageSize: 20,
      totalCount: 21,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    render(
      await ListingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          q: " Paged ",
          listingType: "Rent",
          propertyType: "House",
          page: "5",
          lang: "mk",
          pageSize: "99",
          sort: "oldest",
        }),
      })
    );

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: {
        q: "Paged",
        listingType: "Rent",
        propertyType: "House",
        page: 5,
      },
    });
    expect(screen.getByRole("region", { name: "Results" })).toHaveTextContent(
      "21 properties found"
    );
    expect(
      screen.getByRole("link", { name: "Return to the first page" })
    ).toHaveAttribute(
      "href",
      "/en/listings?listingType=Rent&propertyType=House&q=Paged"
    );
    expect(
      screen.queryByRole("heading", { name: "No matching properties" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No properties available" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Result pages" })
    ).not.toBeInTheDocument();
  });

  it("passes backend page metadata to navigation without another retrieval", async () => {
    vi.mocked(getPublicListings).mockResolvedValueOnce({
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          listingType: "Rent",
          propertyType: "House",
          price: 1200,
          currency: "EUR",
          areaSquareMeters: 160,
          title: "Paged family house",
          languageCode: "en",
          city: "Skopje",
          municipality: "Karpoš",
        },
      ],
      page: 2,
      pageSize: 20,
      totalCount: 21,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    render(
      await ListingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          q: " Paged ",
          listingType: "Rent",
          propertyType: "House",
          page: "2",
          lang: "mk",
        }),
      })
    );

    expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      query: {
        q: "Paged",
        listingType: "Rent",
        propertyType: "House",
        page: 2,
      },
    });
    expect(screen.getByRole("region", { name: "Results" })).toHaveTextContent(
      "21 properties found"
    );
    expect(
      screen.getByRole("article", { name: "Paged family house" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Keyword or location" })
    ).toHaveValue("Paged");
    expect(screen.getByRole("combobox", { name: "Listing type" })).toHaveValue(
      "Rent"
    );
    expect(screen.getByRole("combobox", { name: "Property type" })).toHaveValue(
      "House"
    );
    const pagination = screen.getByRole("navigation", { name: "Result pages" });
    expect(pagination).toHaveTextContent("Page 2 of 2");
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/en/listings?listingType=Rent&propertyType=House&q=Paged"
    );
    expect(
      screen.queryByRole("link", { name: "Next page" })
    ).not.toBeInTheDocument();
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
      expect(
        screen.queryByRole("heading", { level: 2 })
      ).not.toBeInTheDocument();
    }
  );
});
