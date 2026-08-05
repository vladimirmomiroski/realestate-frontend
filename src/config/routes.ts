import { getPathLocale, type Locale } from "@/i18n/config";

function encodeRouteParameter(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new TypeError(`${name} must not be empty`);
  }

  return encodeURIComponent(normalized);
}

export const routes = {
  home: (locale: Locale) => `/${locale}`,
  listings: (locale: Locale) => `/${locale}/listings`,
  listingDetails: (locale: Locale, listingId: string) =>
    `/${locale}/listings/${encodeRouteParameter(listingId, "listingId")}`,
  agencyProfile: (locale: Locale, slug: string) =>
    `/${locale}/agencies/${encodeRouteParameter(slug, "slug")}`,
} as const;

export function getEquivalentLocalePath(
  locale: Locale,
  pathname: string,
  searchParams?: string | URLSearchParams
): string {
  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    pathname.includes("?") ||
    pathname.includes("#")
  ) {
    throw new TypeError("pathname must be an absolute application pathname");
  }

  const currentLocale = getPathLocale(pathname);
  const unprefixedPath = currentLocale
    ? pathname.slice(currentLocale.length + 1)
    : pathname;
  const normalizedPath =
    unprefixedPath === "" || unprefixedPath === "/" ? "" : unprefixedPath;
  const normalizedSearch = new URLSearchParams(
    typeof searchParams === "string"
      ? searchParams.replace(/^\?/, "")
      : searchParams
  ).toString();

  return `/${locale}${normalizedPath}${normalizedSearch ? `?${normalizedSearch}` : ""}`;
}
