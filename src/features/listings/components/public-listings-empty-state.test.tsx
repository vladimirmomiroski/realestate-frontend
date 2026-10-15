import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { parsePublicListingsSearchParams } from "../search/public-listings-search";
import { PublicListingsEmptyState } from "./public-listings-empty-state";

function validSearch(
  params: Record<string, string | string[] | undefined> = {}
) {
  const search = parsePublicListingsSearchParams(params);
  if (search.kind !== "valid") throw new Error("Expected valid search fixture");
  return search;
}

for (const { locale, dictionary } of [
  { locale: "en", dictionary: en },
  { locale: "mk", dictionary: mk },
] as const) {
  describe(`${locale} catalog empty states`, () => {
    it.each(["1", "4"])(
      "shows a clean zero-total catalog on page %s without reset advice",
      (page) => {
        render(
          <PublicListingsEmptyState
            totalCount={0}
            search={validSearch({ page })}
            locale={locale}
            labels={dictionary.listings}
          />
        );

        const region = screen.getByRole("region", {
          name: dictionary.listings.catalogEmptyTitle,
        });
        expect(
          within(region).getByRole("heading", { level: 2 })
        ).toHaveTextContent(dictionary.listings.catalogEmptyTitle);
        expect(
          within(region).getByText(dictionary.listings.catalogEmptyDescription)
        ).toBeInTheDocument();
        expect(within(region).queryByRole("link")).not.toBeInTheDocument();
        expect(
          screen.queryByText(dictionary.listings.emptyPageTitle)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(dictionary.listings.emptyDescription)
        ).not.toBeInTheDocument();
      }
    );

    it.each([
      { q: "Family" },
      { listingType: "Rent" },
      { propertyType: "House" },
      { q: "Family", listingType: "Rent", propertyType: "House" },
    ])("offers clean-catalog recovery for normalized filters %j", (filters) => {
      render(
        <PublicListingsEmptyState
          totalCount={0}
          search={validSearch({ ...filters, page: "4" })}
          locale={locale}
          labels={dictionary.listings}
        />
      );

      const region = screen.getByRole("region", {
        name: dictionary.listings.emptyTitle,
      });
      expect(
        within(region).getByText(dictionary.listings.emptyDescription)
      ).toBeInTheDocument();
      expect(
        within(region).getByRole("link", {
          name: dictionary.listings.clearSearch,
        })
      ).toHaveAttribute("href", `/${locale}/listings`);
      expect(within(region).getAllByRole("link")).toHaveLength(1);
      expect(
        screen.queryByText(dictionary.listings.emptyPageTitle)
      ).not.toBeInTheDocument();
    });

    it("recovers a positive-total empty page with valid filters and the route locale", () => {
      render(
        <PublicListingsEmptyState
          totalCount={24}
          search={validSearch({
            q: " Family ",
            listingType: "Rent",
            propertyType: "House",
            page: "5",
            lang: "ignored",
            sort: "oldest",
            pageSize: "99",
          })}
          locale={locale}
          labels={dictionary.listings}
        />
      );

      const region = screen.getByRole("region", {
        name: dictionary.listings.emptyPageTitle,
      });
      expect(
        within(region).getByText(dictionary.listings.emptyPageDescription)
      ).toBeInTheDocument();
      expect(
        within(region).getByRole("link", {
          name: dictionary.listings.firstPage,
        })
      ).toHaveAttribute(
        "href",
        `/${locale}/listings?listingType=Rent&propertyType=House&q=Family`
      );
      expect(
        screen.queryByText(dictionary.listings.catalogEmptyTitle)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(dictionary.listings.emptyTitle)
      ).not.toBeInTheDocument();
    });

    it("uses the clean first-page URL when an empty requested page has no filters", () => {
      render(
        <PublicListingsEmptyState
          totalCount={4}
          search={validSearch({
            page: "3",
            listingType: ["Rent", "Sale"],
            propertyType: "Land",
          })}
          locale={locale}
          labels={dictionary.listings}
        />
      );

      expect(
        screen.getByRole("link", { name: dictionary.listings.firstPage })
      ).toHaveAttribute("href", `/${locale}/listings`);
    });
  });
}

it("provides calm heading semantics without invented cards, counts, or pagination", () => {
  const { container } = render(
    <PublicListingsEmptyState
      totalCount={0}
      search={validSearch()}
      locale="en"
      labels={en.listings}
    />
  );

  expect(screen.getAllByRole("heading")).toHaveLength(1);
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(container.querySelector("[aria-live], [tabindex], button")).toBeNull();
  expect(container).not.toHaveTextContent(/\d|properties found/);
});
