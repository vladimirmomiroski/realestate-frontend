import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getPathLocale,
  isSupportedLocale,
  selectLocale,
} from "./config";

describe("locale configuration", () => {
  it.each(["mk", "en"])("recognizes supported locale %s", (locale) => {
    expect(isSupportedLocale(locale)).toBe(true);
  });

  it.each(["fr", "EN", "", null, undefined, 1])(
    "rejects unsupported locale %s",
    (locale) => {
      expect(isSupportedLocale(locale)).toBe(false);
    }
  );

  it("prefers a valid locale cookie", () => {
    expect(selectLocale({ cookieLocale: "en", acceptLanguage: "mk-MK" })).toBe(
      "en"
    );
  });

  it("uses the best supported Accept-Language preference", () => {
    expect(
      selectLocale({
        cookieLocale: "fr",
        acceptLanguage: "de-DE;q=0.9, en-GB;q=0.8, mk-MK;q=0.7",
      })
    ).toBe("en");
  });

  it("ignores languages with zero quality", () => {
    expect(selectLocale({ acceptLanguage: "en;q=0, mk;q=0.5" })).toBe("mk");
  });

  it("falls back to Macedonian for invalid preferences", () => {
    expect(
      selectLocale({ cookieLocale: "fr", acceptLanguage: "de, *;q=0.5" })
    ).toBe(defaultLocale);
    expect(defaultLocale).toBe("mk");
  });

  it("reads only exact supported path prefixes", () => {
    expect(getPathLocale("/mk/listings")).toBe("mk");
    expect(getPathLocale("/en")).toBe("en");
    expect(getPathLocale("/english/listings")).toBeNull();
    expect(getPathLocale("/fr/listings")).toBeNull();
  });
});
