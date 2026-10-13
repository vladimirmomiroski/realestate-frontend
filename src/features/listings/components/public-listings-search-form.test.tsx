import { render, screen, within } from "@testing-library/react";
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

      expect(form).toHaveAttribute("action", `/${locale}/listings`);
      expect(form).not.toHaveAttribute("method");
      expect(input).toHaveAttribute("name", "q");
      expect(input).toHaveValue("");
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(input).toHaveAccessibleDescription(dictionary.listings.searchHint);
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
