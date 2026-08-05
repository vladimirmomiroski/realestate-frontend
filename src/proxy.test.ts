import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { localeCookieName } from "@/i18n/config";

import { config, isLocaleRoutingPath, proxy } from "./proxy";

function createRequest(
  path: string,
  options: { acceptLanguage?: string; cookieLocale?: string } = {}
) {
  const headers = new Headers();

  if (options.acceptLanguage) {
    headers.set("accept-language", options.acceptLanguage);
  }

  if (options.cookieLocale) {
    headers.set("cookie", `${localeCookieName}=${options.cookieLocale}`);
  }

  return new NextRequest(`https://frontend.example${path}`, { headers });
}

describe("locale proxy", () => {
  it("passes valid locale-prefixed paths and persists the locale", () => {
    const response = proxy(createRequest("/en/listings?page=2"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(localeCookieName)?.value).toBe("en");
  });

  it("redirects using a valid preference cookie and preserves path and query", () => {
    const response = proxy(
      createRequest("/listings?city=Skopje&page=2", {
        acceptLanguage: "mk",
        cookieLocale: "en",
      })
    );

    expect(response.headers.get("location")).toBe(
      "https://frontend.example/en/listings?city=Skopje&page=2"
    );
    expect(response.cookies.get(localeCookieName)?.value).toBe("en");
  });

  it("uses a supported browser language when the cookie is invalid", () => {
    const response = proxy(
      createRequest("/", {
        acceptLanguage: "en-GB,en;q=0.8",
        cookieLocale: "fr",
      })
    );

    expect(response.headers.get("location")).toBe(
      "https://frontend.example/en"
    );
  });

  it("falls back to Macedonian for unsupported preferences", () => {
    const response = proxy(
      createRequest("/about?source=home", {
        acceptLanguage: "de-DE, fr;q=0.8",
        cookieLocale: "invalid",
      })
    );

    expect(response.headers.get("location")).toBe(
      "https://frontend.example/mk/about?source=home"
    );
  });

  it("does not treat an invalid leading segment as a locale", () => {
    const response = proxy(createRequest("/fr/listings"));

    expect(response.headers.get("location")).toBe(
      "https://frontend.example/mk/fr/listings"
    );
  });

  it.each([
    "/api/listings",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest",
    "/images/logo.png",
    "/documents/terms.pdf/download",
  ])("excludes %s", (pathname) => {
    expect(isLocaleRoutingPath(pathname)).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname })
    ).toBe(false);
  });

  it("matches localized and unprefixed application paths", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/" })
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/mk/listings",
      })
    ).toBe(true);
  });
});
