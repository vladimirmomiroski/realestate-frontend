import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import type { PublicListingCard } from "../model/public-listing-card";
import { PublicListingsResults } from "./public-listings-results";

const items: PublicListingCard[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    listingType: "Sale",
    propertyType: "Apartment",
    price: 145000,
    currency: "EUR",
    areaSquareMeters: 82.5,
    title: "First apartment",
    languageCode: "en",
    city: "Skopje",
    municipality: "Centar",
    primaryImageUrl: "/uploads/listings/preview.png",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    listingType: "Rent",
    propertyType: "Land",
    price: 68000,
    currency: "EUR",
    areaSquareMeters: 540,
    title: "Second plot",
    languageCode: "en",
    city: "Ohrid",
    municipality: "Ohrid",
  },
];

describe("PublicListingsResults", () => {
  it.each([
    {
      totalCount: 0,
      dictionary: en,
      locale: "en",
      summary: "0 properties found",
    },
    {
      totalCount: 1,
      dictionary: en,
      locale: "en",
      summary: "1 property found",
    },
    {
      totalCount: 24,
      dictionary: en,
      locale: "en",
      summary: "24 properties found",
    },
    {
      totalCount: 0,
      dictionary: mk,
      locale: "mk",
      summary: "Пронајдени имоти: 0",
    },
    {
      totalCount: 1,
      dictionary: mk,
      locale: "mk",
      summary: "Пронајден е 1 имот",
    },
    {
      totalCount: 24,
      dictionary: mk,
      locale: "mk",
      summary: "Пронајдени имоти: 24",
    },
  ] as const)(
    "renders $locale summary for $totalCount backend results",
    ({ totalCount, dictionary, locale, summary }) => {
      render(
        <PublicListingsResults
          items={totalCount === 0 ? [] : items.slice(0, 1)}
          totalCount={totalCount}
          locale={locale}
          dictionary={dictionary}
        />
      );

      const region = screen.getByRole("region", {
        name: dictionary.listings.results,
      });
      expect(within(region).getByText(summary)).toBeInTheDocument();
      expect(region).not.toHaveAttribute("aria-live");
      expect(within(region).queryAllByRole("article")).toHaveLength(
        totalCount === 0 ? 0 : 1
      );
    }
  );

  it("keeps backend order, stable identity, and media inside semantic articles", () => {
    render(
      <PublicListingsResults
        items={items}
        totalCount={24}
        locale="en"
        dictionary={en}
      />
    );

    const region = screen.getByRole("region", { name: "Results" });
    const articles = within(region).getAllByRole("article");
    expect(articles).toHaveLength(2);
    const first = articles[0]!;
    const second = articles[1]!;
    expect(
      articles.map((article) => article.getAttribute("aria-labelledby"))
    ).toEqual([
      `listing-title-${items[0]!.id}`,
      `listing-title-${items[1]!.id}`,
    ]);
    expect(
      within(first).getByRole("heading", {
        name: "First apartment",
        level: 2,
      })
    ).toBeInTheDocument();
    expect(
      within(second).getByRole("heading", {
        name: "Second plot",
        level: 2,
      })
    ).toBeInTheDocument();
    expect(within(first).getByAltText("")).toHaveAttribute(
      "src",
      expect.stringContaining("/_next/image?")
    );
    expect(
      within(second).getByText(en.listings.imageUnavailable)
    ).toBeInTheDocument();
    expect(within(region).getByText("24 properties found")).toBeInTheDocument();
    expect(region.querySelectorAll("ul, ol, li")).toHaveLength(0);
    expect(region.querySelector("div.grid")).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "xl:grid-cols-3",
      "gap-6"
    );
  });
});
