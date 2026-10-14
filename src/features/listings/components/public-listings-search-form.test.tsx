import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { parsePublicListingsSearchParams } from "../search/public-listings-search";
import { PublicListingsSearchForm } from "./public-listings-search-form";

const locales = [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const;

describe("PublicListingsSearchForm", () => {
  it.each(locales)(
    "renders the localized $locale form with a named input and clean action",
    ({ locale, dictionary }) => {
      render(
        <PublicListingsSearchForm
          locale={locale}
          search={parsePublicListingsSearchParams({})}
          labels={dictionary.listings}
        />
      );

      const form = screen.getByRole("search", {
        name: dictionary.listings.search,
      });
      const input = within(form).getByRole("searchbox", {
        name: dictionary.listings.searchLabel,
      });
      const listingType = within(form).getByRole("combobox", {
        name: dictionary.listings.listingType,
      });
      const propertyType = within(form).getByRole("combobox", {
        name: dictionary.listings.propertyType,
      });

      expect(form).toHaveAttribute("action", `/${locale}/listings`);
      expect(form).not.toHaveAttribute("method");
      expect(input).toHaveAttribute("name", "q");
      expect(input).toHaveValue("");
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(input).toHaveAccessibleDescription(dictionary.listings.searchHint);
      expect(listingType).toHaveAttribute("name", "listingType");
      expect(propertyType).toHaveAttribute("name", "propertyType");
      expect(listingType).toHaveValue("");
      expect(propertyType).toHaveValue("");
      expect(
        within(listingType)
          .getAllByRole("option")
          .map((option) => ({
            value: (option as HTMLOptionElement).value,
            label: option.textContent,
          }))
      ).toEqual([
        { value: "", label: dictionary.listings.allListingTypes },
        { value: "Sale", label: dictionary.listings.listingTypes.Sale },
        { value: "Rent", label: dictionary.listings.listingTypes.Rent },
      ]);
      expect(
        within(propertyType)
          .getAllByRole("option")
          .map((option) => ({
            value: (option as HTMLOptionElement).value,
            label: option.textContent,
          }))
      ).toEqual([
        { value: "", label: dictionary.listings.allPropertyTypes },
        {
          value: "Apartment",
          label: dictionary.listings.propertyTypes.Apartment,
        },
        { value: "House", label: dictionary.listings.propertyTypes.House },
      ]);
      expect(form.querySelector('[name="page"]')).toBeNull();
      expect(
        form.querySelector('[name="lang"], [name="sort"], [name="pageSize"]')
      ).toBeNull();
      expect(
        within(form).getByRole("button", { name: dictionary.listings.search })
      ).toHaveAttribute("type", "submit");
      expect(within(form).queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: dictionary.listings.clearSearch })
      ).not.toBeInTheDocument();
    }
  );

  it.each([
    { listingType: "Sale", propertyType: "Apartment" },
    { listingType: "Rent", propertyType: "House" },
  ])(
    "restores combined keyword and $listingType/$propertyType selections",
    ({ listingType, propertyType }) => {
      const search = parsePublicListingsSearchParams({
        q: "  Family  ",
        listingType,
        propertyType,
        page: "4",
      });
      render(
        <PublicListingsSearchForm
          locale="en"
          search={search}
          labels={en.listings}
        />
      );

      const form = screen.getByRole("search", { name: en.listings.search });
      expect(within(form).getByRole("searchbox")).toHaveValue("Family");
      expect(
        within(form).getByRole("combobox", { name: en.listings.listingType })
      ).toHaveValue(listingType);
      expect(
        within(form).getByRole("combobox", { name: en.listings.propertyType })
      ).toHaveValue(propertyType);
      expect(new FormData(form as HTMLFormElement).get("q")).toBe("Family");
      expect(new FormData(form as HTMLFormElement).get("listingType")).toBe(
        listingType
      );
      expect(new FormData(form as HTMLFormElement).get("propertyType")).toBe(
        propertyType
      );
      expect(new FormData(form as HTMLFormElement).has("page")).toBe(false);
      expect(
        screen.getByRole("link", { name: en.listings.reset })
      ).toHaveAttribute("href", "/en/listings");
    }
  );

  it("normalizes unsupported and repeated selections to All", () => {
    render(
      <PublicListingsSearchForm
        locale="mk"
        search={parsePublicListingsSearchParams({
          listingType: ["Sale", "Rent"],
          propertyType: "Commercial",
        })}
        labels={mk.listings}
      />
    );

    expect(
      screen.getByRole("combobox", { name: mk.listings.listingType })
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: mk.listings.propertyType })
    ).toHaveValue("");
    expect(screen.queryByRole("link", { name: mk.listings.reset })).toBeNull();
  });

  it("tabs through keyword, both selects, submit, then reset", async () => {
    const user = userEvent.setup();
    render(
      <PublicListingsSearchForm
        locale="en"
        search={parsePublicListingsSearchParams({ listingType: "Rent" })}
        labels={en.listings}
      />
    );

    await user.tab();
    expect(screen.getByRole("searchbox")).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("combobox", { name: en.listings.listingType })
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("combobox", { name: en.listings.propertyType })
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: en.listings.search })
    ).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: en.listings.reset })).toHaveFocus();
  });

  it.each(locales)(
    "restores a normalized valid keyword and offers $locale clear navigation",
    ({ locale, dictionary }) => {
      render(
        <PublicListingsSearchForm
          locale={locale}
          search={parsePublicListingsSearchParams({ q: "  Family  " })}
          labels={dictionary.listings}
        />
      );

      const input = screen.getByRole("searchbox", {
        name: dictionary.listings.searchLabel,
      });
      expect(input).toHaveValue("Family");
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: dictionary.listings.clearSearch })
      ).toHaveAttribute("href", `/${locale}/listings`);
    }
  );

  it.each([
    { q: " x ", error: en.listings.searchTooShort },
    { q: "x".repeat(101), error: en.listings.searchTooLong },
  ])("associates invalid keyword feedback with the input", ({ q, error }) => {
    render(
      <PublicListingsSearchForm
        locale="en"
        search={parsePublicListingsSearchParams({ q })}
        labels={en.listings}
      />
    );

    const input = screen.getByRole("searchbox", {
      name: en.listings.searchLabel,
    });
    expect(input).toHaveValue(q);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      `${en.listings.searchHint} ${error}`
    );
    expect(screen.getByText(error)).toHaveAttribute(
      "id",
      "public-listings-keyword-error"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      en.listings.searchInvalidSummary
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("rejects repeated q without choosing one value for the input", () => {
    render(
      <PublicListingsSearchForm
        locale="mk"
        search={parsePublicListingsSearchParams({
          q: ["Скопје", "Битола"],
        })}
        labels={mk.listings}
      />
    );

    const input = screen.getByRole("searchbox", {
      name: mk.listings.searchLabel,
    });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      `${mk.listings.searchHint} ${mk.listings.searchRepeated}`
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      mk.listings.searchInvalidSummary
    );
    expect(
      screen.getByRole("link", { name: mk.listings.clearSearch })
    ).toHaveAttribute("href", "/mk/listings");
  });
});
