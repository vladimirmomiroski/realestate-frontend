import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClientDictionaryProvider } from "@/i18n/client-context";
import { getClientDictionary } from "@/i18n/client-dictionary";
import { en } from "@/i18n/dictionaries/en";

import { LocaleSwitcher } from "./locale-switcher";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/listings",
  useSearchParams: () =>
    new URLSearchParams(
      "city=Skopje&propertyType=House&propertyType=Apartment"
    ),
}));

describe("LocaleSwitcher", () => {
  it("names the language navigation and identifies the current locale", () => {
    render(
      <ClientDictionaryProvider
        dictionary={getClientDictionary(en)}
        locale="en"
      >
        <LocaleSwitcher />
      </ClientDictionaryProvider>
    );

    expect(
      screen.getByRole("navigation", { name: "Language" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("link", { name: "Macedonian" })
    ).not.toHaveAttribute("aria-current");
  });

  it("preserves the equivalent route and every query value", () => {
    render(
      <ClientDictionaryProvider
        dictionary={getClientDictionary(en)}
        locale="en"
      >
        <LocaleSwitcher />
      </ClientDictionaryProvider>
    );

    expect(screen.getByRole("link", { name: "Macedonian" })).toHaveAttribute(
      "href",
      "/mk/listings?city=Skopje&propertyType=House&propertyType=Apartment"
    );
  });
});
