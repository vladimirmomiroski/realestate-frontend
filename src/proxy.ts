import { NextResponse, type NextRequest } from "next/server";

import { getPathLocale, localeCookieName, selectLocale } from "@/i18n/config";

const localeCookieOptions = {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax" as const,
};

const metadataPaths = new Set([
  "/favicon.ico",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
]);

export function isLocaleRoutingPath(pathname: string): boolean {
  if (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/_next" ||
    pathname.startsWith("/_next/") ||
    metadataPaths.has(pathname)
  ) {
    return false;
  }

  return !pathname.split("/").some((segment) => /\.[^./]+$/.test(segment));
}

function persistLocale(response: NextResponse, locale: "mk" | "en") {
  response.cookies.set(localeCookieName, locale, localeCookieOptions);

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isLocaleRoutingPath(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getPathLocale(pathname);

  if (pathLocale) {
    return persistLocale(NextResponse.next(), pathLocale);
  }

  const locale = selectLocale({
    cookieLocale: request.cookies.get(localeCookieName)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return persistLocale(NextResponse.redirect(redirectUrl), locale);
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
