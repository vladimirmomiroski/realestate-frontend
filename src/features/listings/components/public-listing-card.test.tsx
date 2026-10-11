import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import type { PublicListingCard } from "../model/public-listing-card";
import {
  formatAreaSquareMeters,
  formatPrice,
  formatPricePerSquareMeter,
} from "../utils/listing-formatters";
import { PublicListingCardView } from "./public-listing-card";

const listing: PublicListingCard = {
  id: "b1b7479c-bdae-4d3b-9771-3150f96a6cd2",
  listingType: "Sale",
  propertyType: "Apartment",
  price: 145_000,
  currency: "EUR",
  areaSquareMeters: 82.5,
  rooms: 3,
  pricePerSquareMeter: 1757.58,
  title: "Стан во Центар",
  city: "Скопје",
  municipality: "Центар",
  neighborhood: "Дебар Маало",
  languageCode: "mk",
};

describe("PublicListingCardView", () => {
  it("names a semantic article with unchanged backend title and location", () => {
    render(
      <PublicListingCardView listing={listing} locale="en" dictionary={en} />
    );

    const article = screen.getByRole("article", { name: listing.title });
    const heading = within(article).getByRole("heading", {
      level: 2,
      name: listing.title,
    });

    expect(article).toContainElement(heading);
    expect(heading.closest("[lang]")).toHaveAttribute("lang", "mk");
    expect(
      within(article).getByText("Дебар Маало, Центар, Скопје").closest("[lang]")
    ).toHaveAttribute("lang", "mk");
    expect(within(article).queryByRole("link")).not.toBeInTheDocument();
    expect(within(article).queryByRole("button")).not.toBeInTheDocument();
    expect(within(article).queryByRole("img")).not.toBeInTheDocument();
  });

  it.each([
    { locale: "mk", dictionary: mk },
    { locale: "en", dictionary: en },
  ] as const)(
    "uses $locale labels and formatting",
    ({ locale, dictionary }) => {
      render(
        <PublicListingCardView
          listing={listing}
          locale={locale}
          dictionary={dictionary}
        />
      );

      const article = screen.getByRole("article", { name: listing.title });
      expect(
        within(article).getByText(
          `${dictionary.listings.listingTypes.Sale} · ${dictionary.listings.propertyTypes.Apartment}`
        )
      ).toBeInTheDocument();
      expect(
        within(article).getByText(dictionary.listings.price)
      ).toBeInTheDocument();
      expect(
        within(article).getByText(formatPrice(listing.price, "EUR", locale), {
          normalizer: (value) => value,
        })
      ).toBeInTheDocument();
      expect(
        within(article).getByText(dictionary.listings.area)
      ).toBeInTheDocument();
      expect(
        within(article).getByText(formatAreaSquareMeters(82.5, locale))
      ).toBeInTheDocument();
      expect(
        within(article).getByText(dictionary.listings.rooms)
      ).toBeInTheDocument();
      expect(within(article).getByText("3")).toBeInTheDocument();
      expect(
        within(article).getByText(dictionary.listings.pricePerSquareMeter)
      ).toBeInTheDocument();
      expect(
        within(article).getByText(
          formatPricePerSquareMeter(1757.58, "EUR", locale),
          { normalizer: (value) => value }
        )
      ).toBeInTheDocument();
    }
  );

  it.each(["Apartment", "House", "Commercial", "Land"] as const)(
    "renders the localized %s root",
    (propertyType) => {
      render(
        <PublicListingCardView
          listing={{ ...listing, propertyType }}
          locale="en"
          dictionary={en}
        />
      );

      expect(
        screen.getByText(`Sale · ${en.listings.propertyTypes[propertyType]}`)
      ).toBeInTheDocument();
    }
  );

  it("omits absent optional facts and keeps required location", () => {
    render(
      <PublicListingCardView
        listing={{
          ...listing,
          neighborhood: undefined,
          rooms: undefined,
          pricePerSquareMeter: undefined,
        }}
        locale="en"
        dictionary={en}
      />
    );

    const article = screen.getByRole("article", { name: listing.title });
    expect(within(article).getByText("Центар, Скопје")).toBeInTheDocument();
    expect(
      within(article).queryByText(en.listings.rooms)
    ).not.toBeInTheDocument();
    expect(
      within(article).queryByText(en.listings.pricePerSquareMeter)
    ).not.toBeInTheDocument();
  });

  it("shows a repeated municipality and city only once", () => {
    render(
      <PublicListingCardView
        listing={{
          ...listing,
          neighborhood: "Old Bazaar",
          municipality: "Bitola",
          city: "Bitola",
        }}
        locale="en"
        dictionary={en}
      />
    );

    const article = screen.getByRole("article", { name: listing.title });
    expect(within(article).getByText("Old Bazaar, Bitola")).toBeInTheDocument();
    expect(
      within(article).queryByText("Old Bazaar, Bitola, Bitola")
    ).not.toBeInTheDocument();
  });

  it("preserves distinct location spelling, casing, and order", () => {
    render(
      <PublicListingCardView
        listing={{
          ...listing,
          neighborhood: "Old Bazaar",
          municipality: "Bitola",
          city: "bitola",
        }}
        locale="en"
        dictionary={en}
      />
    );

    const article = screen.getByRole("article", { name: listing.title });
    expect(
      within(article).getByText("Old Bazaar, Bitola, bitola")
    ).toBeInTheDocument();
  });

  it("does not treat zero-valued optional facts as absent", () => {
    render(
      <PublicListingCardView
        listing={{ ...listing, rooms: 0, pricePerSquareMeter: 0 }}
        locale="en"
        dictionary={en}
      />
    );

    const article = screen.getByRole("article", { name: listing.title });
    expect(within(article).getByText(en.listings.rooms)).toBeInTheDocument();
    expect(within(article).getByText("0")).toBeInTheDocument();
    expect(
      within(article).getByText(en.listings.pricePerSquareMeter)
    ).toBeInTheDocument();
  });
});
