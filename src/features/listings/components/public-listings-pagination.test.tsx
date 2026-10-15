import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { parsePublicListingsSearchParams } from "../search/public-listings-search";
import { PublicListingsPagination } from "./public-listings-pagination";

const search = parsePublicListingsSearchParams({
  q: " Family ",
  listingType: "Rent",
  propertyType: "House",
});

if (search.kind !== "valid") {
  throw new Error("Expected valid search fixture");
}

describe("PublicListingsPagination", () => {
  it("links forward from the first page with valid filters", () => {
    render(
      <PublicListingsPagination
        pagination={{
          page: 1,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        }}
        search={search}
        locale="en"
        labels={en.listings}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Result pages" });
    expect(within(nav).getByText("Page 1 of 3")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      within(nav).getByRole("link", { name: "Next page" })
    ).toHaveAttribute(
      "href",
      "/en/listings?listingType=Rent&page=2&propertyType=House&q=Family"
    );
    expect(
      within(nav).queryByRole("link", { name: "Previous page" })
    ).not.toBeInTheDocument();
    expect(nav.querySelectorAll("a, button, [tabindex]")).toHaveLength(1);
  });

  it("links in both directions from a middle page and marks the current page", () => {
    render(
      <PublicListingsPagination
        pagination={{
          page: 2,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        }}
        search={search}
        locale="mk"
        labels={mk.listings}
      />
    );

    const nav = screen.getByRole("navigation", {
      name: mk.listings.pagination,
    });
    expect(within(nav).getByText("Страница 2 од 3")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      within(nav).getByRole("link", { name: mk.listings.previousPage })
    ).toHaveAttribute(
      "href",
      "/mk/listings?listingType=Rent&propertyType=House&q=Family"
    );
    expect(
      within(nav).getByRole("link", { name: mk.listings.nextPage })
    ).toHaveAttribute(
      "href",
      "/mk/listings?listingType=Rent&page=3&propertyType=House&q=Family"
    );
    expect(nav.querySelectorAll("a, button, [tabindex]")).toHaveLength(2);
  });

  it("links backward from the last page without a disabled next anchor", () => {
    render(
      <PublicListingsPagination
        pagination={{
          page: 3,
          totalPages: 3,
          hasNextPage: false,
          hasPreviousPage: true,
        }}
        search={search}
        locale="en"
        labels={en.listings}
      />
    );

    const nav = screen.getByRole("navigation", {
      name: en.listings.pagination,
    });
    expect(within(nav).getByText("Page 3 of 3")).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: en.listings.previousPage })
    ).toHaveAttribute(
      "href",
      "/en/listings?listingType=Rent&page=2&propertyType=House&q=Family"
    );
    expect(
      within(nav).queryByRole("link", { name: en.listings.nextPage })
    ).not.toBeInTheDocument();
    expect(
      nav.querySelectorAll("a[aria-disabled], a:not([href])")
    ).toHaveLength(0);
  });

  it.each([
    { page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    { page: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    { page: 3, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
    { page: 3, totalPages: 0, hasNextPage: false, hasPreviousPage: true },
  ])(
    "omits misleading navigation for single, zero, or out-of-range page $page/$totalPages",
    (pagination) => {
      render(
        <PublicListingsPagination
          pagination={pagination}
          search={search}
          locale="en"
          labels={en.listings}
        />
      );

      expect(
        screen.queryByRole("navigation", { name: en.listings.pagination })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: en.listings.previousPage })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: en.listings.nextPage })
      ).not.toBeInTheDocument();
    }
  );
});
