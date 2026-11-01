import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/listings/api/get-public-listings.server", () => ({
  getPublicListings: vi.fn(),
}));

import { getPublicListings } from "@/features/listings/api/get-public-listings.server";
import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";
import {
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
} from "@/lib/api/api-error";

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

  for (const { locale, dictionary } of [
    { locale: "en", dictionary: en },
    { locale: "mk", dictionary: mk },
  ] as const) {
    it(`${locale} composes named landmarks, logical headings, and actual backend content language`, async () => {
      vi.mocked(getPublicListings).mockResolvedValueOnce({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            listingType: "Sale",
            propertyType: "Apartment",
            price: 145000,
            currency: "EUR",
            areaSquareMeters: 82.5,
            title: "Стан во Центар",
            languageCode: "mk",
            city: "Скопје",
            municipality: "Центар",
          },
        ],
        page: 2,
        pageSize: 20,
        totalCount: 21,
        totalPages: 2,
        hasPreviousPage: true,
        hasNextPage: false,
      });
      render(
        await ListingsPage({
          params: Promise.resolve({ locale }),
          searchParams: Promise.resolve({ page: "2" }),
        })
      );
      expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
        locale,
        query: { page: 2 },
      });
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        dictionary.listings.title
      );
      const search = screen.getByRole("search", {
        name: dictionary.listings.search,
      });
      expect(
        within(search).getByRole("searchbox", {
          name: dictionary.listings.searchLabel,
        })
      ).toHaveAccessibleDescription(dictionary.listings.searchHint);
      expect(
        within(search).getByRole("combobox", {
          name: dictionary.listings.listingType,
        })
      ).toBeInTheDocument();
      expect(
        within(search).getByRole("combobox", {
          name: dictionary.listings.propertyType,
        })
      ).toBeInTheDocument();
      const results = screen.getByRole("region", {
        name: dictionary.listings.results,
      });
      expect(results).not.toHaveAttribute("aria-live");
      expect(
        results.querySelector('[role="status"], [role="alert"], [aria-live]')
      ).toBeNull();
      const article = within(results).getByRole("article", {
        name: "Стан во Центар",
      });
      expect(
        within(article).getByRole("heading", { level: 2 }).closest("[lang]")
      ).toHaveAttribute("lang", "mk");
      expect(
        within(article).getByText("Центар, Скопје").closest("[lang]")
      ).toHaveAttribute("lang", "mk");
      expect(within(article).queryByRole("link")).not.toBeInTheDocument();
      expect(within(article).queryByRole("button")).not.toBeInTheDocument();
      expect(
        within(article).getByText(dictionary.listings.imageUnavailable)
      ).toBeInTheDocument();
      const pagination = screen.getByRole("navigation", {
        name: dictionary.listings.pagination,
      });
      expect(
        within(pagination).getByRole("link", {
          name: dictionary.listings.previousPage,
        })
      ).toHaveAttribute("href", `/${locale}/listings`);
      expect(
        within(pagination).queryByRole("link", {
          name: dictionary.listings.nextPage,
        })
      ).not.toBeInTheDocument();
      expect(
        pagination.querySelector('[aria-current="page"]')
      ).toHaveTextContent(
        dictionary.listings.pageOf
          .replace("{page}", "2")
          .replace("{totalPages}", "2")
      );
      expect(
        pagination.querySelector('[aria-disabled], [tabindex="-1"]')
      ).toBeNull();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each([
      [
        new ApiProblemError({
          status: 400,
          code: "validation.failed",
          title: "Private",
          requestId: "validation-id",
        }),
        "validation",
        "validation-id",
      ],
      [
        new ApiProblemError({
          status: 500,
          code: "server.unexpected",
          title: "Private",
          detail: "secret",
          requestId: "server-id",
        }),
        "server",
        "server-id",
      ],
      [
        new ApiHttpError(502, "Gateway", undefined, "text/plain", "secret"),
        "http",
        undefined,
      ],
      [
        new MalformedApiResponseError(
          200,
          "invalid-success-body",
          "malformed-id"
        ),
        "malformed",
        "malformed-id",
      ],
      [new ApiNetworkError(), "network", undefined],
    ] as const)(
      `${locale} presents classified %s separately from empty results`,
      async (error, key, requestId) => {
        vi.mocked(getPublicListings).mockRejectedValueOnce(error);
        const { container } = render(
          await ListingsPage({
            params: Promise.resolve({ locale }),
            searchParams: Promise.resolve({
              q: "Paged",
              listingType: "Rent",
              propertyType: "House",
              page: "2",
            }),
          })
        );
        expect(getPublicListings).toHaveBeenCalledExactlyOnceWith({
          locale,
          query: {
            q: "Paged",
            listingType: "Rent",
            propertyType: "House",
            page: 2,
          },
        });
        expect(screen.getByRole("alert")).toHaveAccessibleName(
          dictionary.listings.failure.title
        );
        expect(
          screen.getByText(dictionary.listings.failure[key])
        ).toBeInTheDocument();
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(
          screen.getByRole("button", { name: dictionary.errors.retry })
        ).toBeInTheDocument();
        expect(screen.getByRole("searchbox")).toHaveValue("Paged");
        expect(
          screen.getByRole("combobox", {
            name: dictionary.listings.listingType,
          })
        ).toHaveValue("Rent");
        expect(
          screen.getByRole("combobox", {
            name: dictionary.listings.propertyType,
          })
        ).toHaveValue("House");
        expect(
          screen.queryByRole("region", {
            name: dictionary.listings.results,
          })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
        expect(
          screen.queryByText(dictionary.listings.catalogEmptyTitle)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(dictionary.listings.emptyPageTitle)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("navigation", {
            name: dictionary.listings.pagination,
          })
        ).not.toBeInTheDocument();
        if (requestId) {
          expect(screen.getByText(requestId)).toBeInTheDocument();
        } else {
          expect(
            screen.queryByText(dictionary.errors.requestIdLabel)
          ).not.toBeInTheDocument();
        }
        expect(container).not.toHaveTextContent(/Private|secret|Gateway/);
      }
    );
  }

  it.each([new ApiAbortError(), new Error("Unexpected rendering failure")])(
    "propagates %s instead of fabricating a classified failure",
    async (error) => {
      vi.mocked(getPublicListings).mockRejectedValueOnce(error);
      await expect(
        ListingsPage({
          params: Promise.resolve({ locale: "en" }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toBe(error);
      expect(getPublicListings).toHaveBeenCalledOnce();
    }
  );

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
