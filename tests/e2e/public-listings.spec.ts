import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { en } from "../../src/i18n/dictionaries/en";
import { mk } from "../../src/i18n/dictionaries/mk";
import {
  formatAreaSquareMeters,
  formatPrice,
} from "../../src/features/listings/utils/listing-formatters";
import { parsePublicListingsResponse } from "../../src/features/listings/api/public-listings-contract";

const localeCases = [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const;

const observedRequestsUrl = "http://localhost:5231/__test/listings-requests";

for (const { locale, dictionary } of localeCases) {
  test(`${locale} enhanced form and locale navigation apply destination metadata`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(`/${locale}/listings`);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, true);
    const documents: string[] = [];
    const flights: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) documents.push(request.url());
      if (request.headers().rsc === "1") flights.push(request.url());
    });

    await page.getByRole("searchbox").fill("Family");
    await page.locator('select[name="listingType"]').selectOption("Rent");
    await page.locator('select[name="propertyType"]').selectOption("House");
    await page.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("q") === "Family"
    );
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(
      page.getByRole("article", { name: "Family house" })
    ).toBeVisible();
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);

    // Empty GET fields still constitute a query-bearing URL.
    await page.getByRole("searchbox").fill("");
    await page.locator('select[name="listingType"]').selectOption("");
    await page.locator('select[name="propertyType"]').selectOption("");
    await page.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL((url) => url.searchParams.get("q") === "");
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);

    const otherLocale = locale === "en" ? "mk" : "en";
    const otherDictionary = otherLocale === "en" ? en : mk;
    await page.locator(`a[hreflang="${otherLocale}"]`).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${otherLocale}/listings` &&
        url.searchParams.get("q") === ""
    );
    await expectCatalogMetadata(
      page,
      otherLocale,
      otherDictionary,
      baseURL!,
      false
    );
    await page
      .getByRole("navigation", {
        name: otherDictionary.accessibility.primaryNavigation,
      })
      .getByRole("link", {
        name: otherDictionary.navigation.listings,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${otherLocale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(
      page,
      otherLocale,
      otherDictionary,
      baseURL!,
      true
    );
    await page.goBack();
    await expect(page).toHaveURL((url) => url.searchParams.get("q") === "");
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(
      page,
      otherLocale,
      otherDictionary,
      baseURL!,
      false
    );
    await page.goForward();
    await expect(page).toHaveURL(`${baseURL}/${otherLocale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(
      page,
      otherLocale,
      otherDictionary,
      baseURL!,
      true
    );
    expect(documents).toEqual([]);
    expect(flights.length).toBeGreaterThan(0);
  });

  test(`${locale} spoofed transport hints cannot make query-bearing HTML indexable`, async ({
    request,
    baseURL,
  }) => {
    const cases: Record<string, string>[] = [
      { rsc: "0" },
      { rsc: "false" },
      { rsc: "1, 1" },
      { "next-router-prefetch": "1" },
      { "next-router-segment-prefetch": "/_tree" },
      { "x-nextjs-data": "1" },
      { rsc: "1" },
      { rsc: "1", "next-router-prefetch": "1" },
      { rsc: "1", "x-now-route-matches": "locale=en" },
    ];
    let documents = 0;
    let flights = 0;
    for (const headers of cases) {
      for (const query of [
        "?_rsc=",
        "?_rsc=x",
        "?%5Frsc=x",
        "?nxtPq=x",
        "?nxtIfoo=x",
        "?__proto__=x",
      ]) {
        const response = await request.get(`/${locale}/listings${query}`, {
          maxRedirects: 0,
          headers: {
            ...headers,
            "x-realestate-catalog-query": "0",
            accept: "text/html",
          },
        });
        const body = await response.text();
        if (response.status() === 307) {
          // Next rejects mismatched Flight cache keys before rendering. Encoded
          // reserved keys can loop if followed; probe the bounded response.
          expect(headers.rsc).toBe("1");
          expect(new URL(response.headers().location!, baseURL).origin).toBe(
            baseURL
          );
          expect(body).not.toContain('<meta name="robots"');
          continue;
        }
        expect(response.status()).toBe(200);
        if (response.headers()["content-type"]?.includes("text/x-component")) {
          flights += 1;
          // A caller can request Flight, but that is not an indexable HTML document.
          expect(body).not.toContain("<!DOCTYPE html>");
        } else {
          documents += 1;
          expect(response.headers()["content-type"]).toContain("text/html");
          expect(
            body.match(/<meta name="robots" content="[^"]*"\s*\/?>/g)
          ).toEqual(['<meta name="robots" content="noindex, follow"/>']);
          expect(body).toContain(
            `<link rel="canonical" href="${baseURL}/${locale}/listings"`
          );
        }
      }
    }
    expect(documents).toBeGreaterThan(0);
    expect(flights).toBeGreaterThan(0);
    // A client-controlled origin hint must not change the locale redirect origin.
    const redirect = await request.get("/listings?_rsc=x", {
      maxRedirects: 0,
      headers: {
        "accept-language": locale,
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
    });
    expect(redirect.status()).toBe(307);
    expect(new URL(redirect.headers().location!, baseURL).href).toBe(
      `${baseURL}/${locale}/listings?_rsc=x`
    );
  });

  test(`${locale} enhanced clear-search navigation restores clean indexing`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(`/${locale}/listings?q=Family`);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);
    await page
      .getByRole("link", { name: dictionary.listings.clearSearch, exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, true);
    await page.goBack();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings?q=Family`);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);
    await page.goForward();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, true);
  });

  test(`${locale} resets dirty controls across raw URLs with equivalent normalized filters`, async ({
    page,
    baseURL,
  }) => {
    const malformed = `/${locale}/listings?listingType=Invalid&listingType=Rent&page=bad`;
    await page.goto(malformed);
    const keyword = page.getByRole("searchbox");
    const listing = page.getByRole("combobox", {
      name: dictionary.listings.listingType,
    });
    const property = page.getByRole("combobox", {
      name: dictionary.listings.propertyType,
    });
    const dirty = async () => {
      await keyword.fill("Family");
      await listing.selectOption("Sale");
      await property.selectOption("House");
      // Moving focus and changing another field must not reset unsent edits.
      await keyword.press("Tab");
      await expect(keyword).toHaveValue("Family");
      await expect(listing).toHaveValue("Sale");
      await expect(property).toHaveValue("House");
    };
    const committed = async (path: string) => {
      await expect(page).toHaveURL(`${baseURL}${path}`);
      await expect(keyword).toHaveValue("");
      await expect(listing).toHaveValue("");
      await expect(property).toHaveValue("");
      await expect(page.getByRole("article")).toHaveCount(4);
      await expect(page.getByRole("article").first()).toHaveAccessibleName(
        "Стан во Центар"
      );
    };
    await committed(malformed);
    await dirty();
    await page
      .getByRole("navigation", {
        name: dictionary.accessibility.primaryNavigation,
      })
      .getByRole("link", { name: dictionary.navigation.listings, exact: true })
      .click();
    await committed(`/${locale}/listings`);
    await dirty();
    await page.goBack();
    await committed(malformed);
    await dirty();
    await page.goForward();
    await committed(`/${locale}/listings`);

    // Supported History API navigation retains raw encoding even where
    // URLSearchParams serialization would make the two URLs identical.
    for (const query of ["?ignored=a%20b", "?ignored=a+b", "?ignored=%61+b"]) {
      await dirty();
      await page.evaluate(
        (url) => window.history.pushState(null, "", url),
        `/${locale}/listings${query}`
      );
      await committed(`/${locale}/listings${query}`);
    }
    await dirty();
    await page.goBack();
    await committed(`/${locale}/listings?ignored=a+b`);
    await dirty();
    await page.goForward();
    await committed(`/${locale}/listings?ignored=%61+b`);
  });

  test(`${locale} restores committed filters after dirty pagination and history navigation`, async ({
    page,
  }) => {
    await page.goto(
      `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House`
    );
    const keyword = page.getByRole("searchbox");
    const listingType = page.getByRole("combobox", {
      name: dictionary.listings.listingType,
    });
    const propertyType = page.getByRole("combobox", {
      name: dictionary.listings.propertyType,
    });
    const dirty = async () => {
      await keyword.fill("Family");
      await listingType.selectOption("Sale");
      await propertyType.selectOption("Apartment");
      await expect(keyword).toHaveValue("Family");
      await expect(listingType).toHaveValue("Sale");
      await expect(propertyType).toHaveValue("Apartment");
    };
    const committed = async (number: number) => {
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/${locale}/listings` &&
          url.searchParams.get("q") === "Paged" &&
          url.searchParams.get("listingType") === "Rent" &&
          url.searchParams.get("propertyType") === "House" &&
          (url.searchParams.get("page") ?? "1") === String(number)
      );
      await expect(page.getByRole("article")).toHaveCount(
        number === 1 ? 20 : 1
      );
      await expect(page.getByRole("article").first()).toContainText(
        number === 1 ? "Paged family house 01" : "Paged family house 21"
      );
      await expect(keyword).toHaveValue("Paged");
      await expect(listingType).toHaveValue("Rent");
      await expect(propertyType).toHaveValue("House");
    };
    await committed(1);
    await dirty();
    await page
      .getByRole("link", { name: dictionary.listings.nextPage, exact: true })
      .click();
    await committed(2);
    await dirty();
    await page
      .getByRole("link", {
        name: dictionary.listings.previousPage,
        exact: true,
      })
      .click();
    await committed(1);
    await dirty();
    await page.goBack();
    await committed(2);
    await dirty();
    await page.goForward();
    await committed(1);
  });

  test(`${locale} raw query presence controls HTTP metadata without JavaScript or trusted client headers`, async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      for (const query of [
        "",
        "?q=Family",
        "?unknown=value",
        "?__proto__=x",
        "?%5F%5Fproto%5F%5F=x",
        "?__proto__",
        "?constructor=x",
        "?toString=x",
        "?_rsc=x",
        "?%5Frsc=x",
        "?nxtPq=x",
        "?nxtIfoo=x",
        "?%6ExtPq=x",
        "?nxtP=x",
        "?nxtI=x",
        "?unknown=&unknown=x",
        "?_rsc=&_rsc=x",
        "?q=",
      ]) {
        // Attempt to spoof the opposite policy; Proxy must replace this value.
        await context.setExtraHTTPHeaders({
          "x-realestate-catalog-query": query ? "0" : "1",
        });
        const response = await page.goto(
          `${baseURL}/${locale}/listings${query}`
        );
        expect(response?.status()).toBe(200);
        expect(response?.headers()["content-type"]).toContain("text/html");
        const robots = query ? "noindex, follow" : "index, follow";
        const html = await response!.text();
        expect(
          html.match(/<meta name="robots" content="[^"]*"\s*\/?>/g)
        ).toEqual([`<meta name="robots" content="${robots}"/>`]);
        await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          robots
        );
        await expect(page).toHaveTitle(dictionary.metadata.listings.title);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${baseURL}/${locale}/listings`
        );
        for (const language of ["mk", "en"]) {
          await expect(
            page.locator(`link[rel="alternate"][hreflang="${language}"]`)
          ).toHaveAttribute("href", `${baseURL}/${language}/listings`);
        }
        await expect(page.getByRole("article")).toHaveCount(
          query === "?q=Family" ? 1 : 4
        );
        await expect(page.getByRole("article").first()).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}

test.afterEach(async ({ request }) => {
  await request.delete(observedRequestsUrl);
});

async function expectListingsRequest(
  request: APIRequestContext,
  query: Record<string, string>
) {
  expect(await (await request.get(observedRequestsUrl)).json()).toEqual([
    {
      method: "GET",
      path: "/api/listings",
      query: Object.entries(query).sort(([left], [right]) =>
        left.localeCompare(right)
      ),
      hasAuthorization: false,
      hasRequestId: false,
    },
  ]);
}

test("fixture HTTP responses satisfy the production adapter and reject unsupported requests", async ({
  request,
}) => {
  try {
    for (const [query, expected] of [
      ["lang=en&pageSize=20", { page: 1, totalCount: 4, count: 4 }],
      [
        "lang=mk&page=2&pageSize=20&q=Paged",
        { page: 2, totalCount: 21, count: 1 },
      ],
      [
        "lang=en&page=5&pageSize=20&q=Paged",
        { page: 5, totalCount: 21, count: 0 },
      ],
      [
        "lang=mk&page=5&pageSize=20&listingType=Rent&propertyType=Apartment",
        { page: 5, totalCount: 0, count: 0 },
      ],
    ] as const) {
      const response = await request.get(
        `http://localhost:5231/api/listings?${query}`
      );
      expect(response.status()).toBe(200);
      const body: unknown = await response.json();
      const page = parsePublicListingsResponse(body);
      expect(page).toMatchObject({
        page: expected.page,
        pageSize: 20,
        totalCount: expected.totalCount,
      });
      expect(page.items).toHaveLength(expected.count);
      if (expected.totalCount === 4) {
        expect(page.items.map((item) => item.propertyType)).toEqual([
          "Apartment",
          "House",
          "Commercial",
          "Land",
        ]);
        expect(new Set(page.items.map((item) => item.id)).size).toBe(4);
        expect(body).toMatchObject({
          items: [
            { status: "Active", languageCode: "mk" },
            { status: "Active", languageCode: "en" },
            {
              status: "Active",
              commercialDetails: { commercialType: "Office" },
            },
            { status: "Active", landDetails: { landType: "BuildingPlot" } },
          ],
        });
      }
    }
    for (const query of [
      "lang=en&pageSize=99",
      ...[
        "sort=newest",
        "q=",
        "listingType=",
        "propertyType=Commercial",
        "page=1&page=2",
        "unknown=value",
      ].map((query) => `lang=en&pageSize=20&${query}`),
    ]) {
      const response = await request.get(
        `http://localhost:5231/api/listings?${query}`
      );
      expect(response.status()).toBe(404);
    }
    const wrongMethod = await request.post(
      "http://localhost:5231/api/listings?lang=en&pageSize=20"
    );
    expect(wrongMethod.status()).toBe(404);
  } finally {
    await request.delete(observedRequestsUrl);
  }
});

for (const { locale, dictionary } of localeCases) {
  test(`${locale} forwards only normalized URL state and suppresses invalid keyword retrieval`, async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const browserRequests: string[] = [];
    page.on("request", (incoming) => {
      if (new URL(incoming.url()).port === "5231")
        browserRequests.push(incoming.url());
    });
    try {
      for (const [query, message] of [
        ["q=x", dictionary.listings.searchTooShort],
        [`q=${"x".repeat(101)}`, dictionary.listings.searchTooLong],
        ["q=Family&q=Paged", dictionary.listings.searchRepeated],
      ] as const) {
        await request.delete(observedRequestsUrl);
        await page.goto(`/${locale}/listings?${query}`);
        await expect(page.getByRole("searchbox")).toHaveAttribute(
          "aria-invalid",
          "true"
        );
        await expect(page.getByRole("article")).toHaveCount(0);
        await expect(page.getByText(message, { exact: true })).toBeVisible();
        await expect(
          page.getByRole("region", { name: dictionary.listings.results })
        ).toHaveCount(0);
        expect(await (await request.get(observedRequestsUrl)).json()).toEqual(
          []
        );
      }
      for (const query of [
        "q=%20%20",
        "listingType=Invalid&propertyType=Commercial",
        "listingType=Sale&listingType=Rent&propertyType=House&propertyType=Apartment",
        ...["0", "-1", "1.5", "bad", "2147483648", "2&page=3"].map(
          (page) => `page=${page}`
        ),
      ]) {
        await request.delete(observedRequestsUrl);
        await page.goto(`/${locale}/listings?${query}`);
        await expect(page.getByRole("article")).toHaveCount(4);
        await expect(page.getByRole("searchbox")).toHaveValue("");
        for (const control of await page.getByRole("combobox").all())
          await expect(control).toHaveValue("");
        await expectListingsRequest(request, { lang: locale, pageSize: "20" });
      }
      await request.delete(observedRequestsUrl);
      await page.goto(
        `/${locale}/listings?q=%20Paged%20&listingType=Rent&propertyType=House&page=2&lang=${locale === "en" ? "mk" : "en"}&pageSize=99&sort=priceAsc&unknown=value`
      );
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText(
        "Paged family house 21"
      );
      await expect(page.getByRole("searchbox")).toHaveValue("Paged");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
      await expectListingsRequest(request, {
        lang: locale,
        pageSize: "20",
        page: "2",
        q: "Paged",
        listingType: "Rent",
        propertyType: "House",
      });
      await expect(
        page
          .getByRole("navigation", { name: dictionary.listings.pagination })
          .getByRole("link", { name: dictionary.listings.previousPage })
      ).toHaveAttribute(
        "href",
        `/${locale}/listings?listingType=Rent&propertyType=House&q=Paged`
      );
      expect(browserRequests).toEqual([]);
    } finally {
      await request.delete(observedRequestsUrl);
    }
  });
}

for (const { locale, dictionary } of localeCases) {
  for (const theme of ["light", "dark"] as const) {
    test(`${locale} ${theme} catalog responsive contrast and long-content audit`, async ({
      page,
      request,
    }) => {
      test.setTimeout(90_000);
      const stress = "http://localhost:5231/__test/catalog-stress";
      const failure = "http://localhost:5231/__test/listings-failure";
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await request.post(`${stress}?lang=${locale}`);
      try {
        await page.goto(`/${locale}/listings`);
        await expect(page.getByRole("article")).toHaveCount(4);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        for (const [width, columns] of [
          [320, 1],
          [360, 1],
          [390, 1],
          [640, 1],
          [768, 2],
          [1024, 2],
          [1280, 3],
          [1440, 3],
        ] as const) {
          await page.setViewportSize({ width, height: 900 });
          const geometry = await page.locator("main").evaluate((main) => {
            const cards = Array.from(main.querySelectorAll("article"));
            return {
              pageWidth: document.documentElement.scrollWidth,
              columns: new Set(
                cards.map((card) => card.getBoundingClientRect().x)
              ).size,
              overflow: cards.flatMap((card) =>
                Array.from(card.querySelectorAll("h2, p, dd"))
                  .filter(
                    (element) =>
                      element.scrollWidth > element.clientWidth + 1 ||
                      element.getBoundingClientRect().right >
                        card.getBoundingClientRect().right
                  )
                  .map((element) => element.textContent)
              ),
              mediaRatios: cards.map((card) => {
                const frame = card.querySelector('[class*="aspect-"]')!;
                const box = frame.getBoundingClientRect();
                return box.width / box.height;
              }),
            };
          });
          expect(geometry.pageWidth).toBeLessThanOrEqual(width);
          expect(geometry.columns).toBe(columns);
          expect(geometry.overflow).toEqual([]);
          for (const ratio of geometry.mediaRatios)
            expect(ratio).toBeCloseTo(4 / 3, 2);
          const selectedText = await page
            .locator("select")
            .evaluateAll((elements) =>
              elements.map((element) => {
                const select = element as HTMLSelectElement;
                const style = getComputedStyle(element);
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d")!;
                context.font = style.font;
                const text = select.selectedOptions[0]!.textContent!;
                return {
                  text,
                  // Reserve space for padding and Chromium's native arrow.
                  required:
                    context.measureText(text).width +
                    Number.parseFloat(style.paddingLeft) +
                    Number.parseFloat(style.paddingRight) +
                    20,
                  available: element.clientWidth,
                };
              })
            );
          for (const select of selectedText) {
            expect(
              select.available,
              `${width}px: ${select.text}`
            ).toBeGreaterThanOrEqual(select.required);
          }
          if (width >= 1024) {
            const keyword = await page.getByRole("searchbox").boundingBox();
            const select = await page
              .getByRole("combobox")
              .first()
              .boundingBox();
            expect(keyword!.width).toBeGreaterThan(select!.width);
          }
        }

        await page.setViewportSize({ width: 320, height: 900 });
        const form = page.getByRole("search");
        const controls = [
          form.getByRole("searchbox"),
          form.getByRole("combobox", { name: dictionary.listings.listingType }),
          form.getByRole("combobox", {
            name: dictionary.listings.propertyType,
          }),
          form.getByRole("button", {
            name: dictionary.listings.search,
            exact: true,
          }),
        ];
        await controls[0]!.focus();
        for (const [index, control] of controls.entries()) {
          if (index) await page.keyboard.press("Tab");
          await expect(control).toBeFocused();
          const readColors = () =>
            control.evaluate((element) => {
              const style = getComputedStyle(element);
              const canvas = document.createElement("canvas");
              canvas.width = canvas.height = 1;
              const context = canvas.getContext("2d")!;
              // Rasterize computed CSS colors, including Tailwind color-mix alpha,
              // over the actual adjacent surface before measuring luminance.
              const luminance = (
                color: string,
                base = style.backgroundColor
              ) => {
                context.fillStyle = base;
                context.fillRect(0, 0, 1, 1);
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                const [r, g, b] = Array.from(
                  context.getImageData(0, 0, 1, 1).data
                )
                  .slice(0, 3)
                  .map((channel) => {
                    const value = channel / 255;
                    return value <= 0.04045
                      ? value / 12.92
                      : ((value + 0.055) / 1.055) ** 2.4;
                  });
                return r! * 0.2126 + g! * 0.7152 + b! * 0.0722;
              };
              const background = luminance(style.backgroundColor);
              const contrast = (
                color: string,
                base = style.backgroundColor
              ) => {
                const foreground = luminance(color, base);
                const adjacent =
                  base === style.backgroundColor ? background : luminance(base);
                return (
                  (Math.max(foreground, adjacent) + 0.05) /
                  (Math.min(foreground, adjacent) + 0.05)
                );
              };
              let ancestor = element.parentElement;
              while (
                ancestor &&
                getComputedStyle(ancestor).backgroundColor ===
                  "rgba(0, 0, 0, 0)"
              )
                ancestor = ancestor.parentElement;
              const surface = getComputedStyle(ancestor!).backgroundColor;
              const box = element.getBoundingClientRect();
              return {
                border: contrast(style.borderTopColor),
                text: contrast(style.color),
                focus: contrast(style.outlineColor, surface),
                outline: style.outlineStyle,
                outlineWidth: Number.parseFloat(style.outlineWidth),
                width: box.width,
                height: box.height,
              };
            });
          // Keyboard focus and its CSS pseudo-class can settle on separate frames.
          await expect
            .poll(async () => (await readColors()).focus)
            .toBeGreaterThanOrEqual(3);
          const colors = await readColors();
          if (index < 3) {
            expect(
              colors.border,
              `${theme} control boundary`
            ).toBeGreaterThanOrEqual(3);
          }
          expect(
            colors.focus,
            `${theme} focus indicator`
          ).toBeGreaterThanOrEqual(3);
          expect(colors.text).toBeGreaterThanOrEqual(4.5);
          expect(colors.outline).not.toBe("none");
          expect(colors.outlineWidth).toBeGreaterThanOrEqual(3);
          expect(colors.width).toBeGreaterThanOrEqual(44);
          expect(colors.height).toBeGreaterThanOrEqual(44);
          console.log(
            `[catalog contrast] ${locale} ${theme} control ${index}: ${JSON.stringify(colors)}`
          );
        }

        await request.delete(stress);
        const checkTargets = async () => {
          const sizes = await page
            .locator("main a[href], main button")
            .evaluateAll((elements) =>
              elements.map((element) => {
                const box = element.getBoundingClientRect();
                return {
                  name: element.textContent,
                  width: box.width,
                  height: box.height,
                };
              })
            );
          for (const size of sizes) {
            // WCAG 2.2 minimum width; retain the established 44px target height.
            expect(size.width, size.name ?? "control").toBeGreaterThanOrEqual(
              24
            );
            expect(size.height, size.name ?? "control").toBeGreaterThanOrEqual(
              44
            );
          }
          for (const target of await page
            .locator("main a[href], main button")
            .all()) {
            await target.focus();
            await expect(target).toBeFocused();
            const outline = await target.evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                style: style.outlineStyle,
                width: Number.parseFloat(style.outlineWidth),
              };
            });
            expect(outline.style).not.toBe("none");
            expect(outline.width).toBeGreaterThanOrEqual(3);
          }
        };
        for (const query of [
          "",
          "?q=Family&listingType=Rent&propertyType=House",
          "?listingType=Rent&propertyType=Apartment",
          "?q=Paged&page=2",
        ]) {
          await page.goto(`/${locale}/listings${query}`);
          await checkTargets();
          const scan = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(scan.violations).toEqual([]);
        }
        await request.post(`${failure}?lang=${locale}&mode=server`);
        await page.goto(`/${locale}/listings`);
        await expect(
          page.getByRole("alert", {
            name: dictionary.listings.failure.title,
            exact: true,
          })
        ).toBeVisible();
        await checkTargets();
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(scan.violations).toEqual([]);
        for (const width of [320, 360]) {
          await page.setViewportSize({ width, height: 900 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth)
          ).toBeLessThanOrEqual(width);
        }
      } finally {
        await request.delete(stress);
        await request.delete(failure);
      }
    });
  }
}

async function expectCatalogMetadata(
  page: Page,
  locale: "mk" | "en",
  dictionary: typeof mk | typeof en,
  origin: string,
  index: boolean
) {
  await expect(page).toHaveTitle(dictionary.metadata.listings.title);
  const head = page.locator("head");
  await expect(head.locator("title")).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(head.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    dictionary.metadata.listings.description
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/${locale}/listings`
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
  for (const language of ["mk", "en"]) {
    await expect(
      head.locator(`link[rel="alternate"][hreflang="${language}"]`)
    ).toHaveAttribute("href", `${origin}/${language}/listings`);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
  await expect(head.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    index ? "index, follow" : "noindex, follow"
  );
  await expect(page.locator('meta[name="googlebot"]')).toHaveCount(0);
}

for (const { locale, dictionary } of localeCases) {
  for (const { name, query } of [
    { name: "clean", query: "" },
    {
      name: "filtered",
      query: "?q=Family&listingType=Rent&propertyType=House",
    },
    { name: "paginated", query: "?q=Paged&page=2" },
    { name: "unknown parameter", query: "?unknown=value" },
    { name: "invalid keyword", query: "?q=x" },
    { name: "explicit default page", query: "?page=1" },
    { name: "empty keyword", query: "?q=" },
  ]) {
    test(`${locale} catalog metadata for ${name} URL`, async ({
      page,
      baseURL,
    }) => {
      const path = `/${locale}/listings${query}`;
      await page.goto(path);
      await expectCatalogMetadata(
        page,
        locale,
        dictionary,
        baseURL!,
        query === ""
      );
      await expect(page).toHaveURL(`${baseURL}${path}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      if (query) {
        const otherLocale = locale === "mk" ? "en" : "mk";
        const switcher = page.getByRole("navigation", {
          name: dictionary.locale.label,
        });
        await expect(
          switcher.getByRole("link", {
            name: dictionary.locale[otherLocale],
            exact: true,
          })
        ).toHaveAttribute("href", `/${otherLocale}/listings${query}`);
      }
    });
  }

  test(`${locale} catalog metadata is server-rendered in the head for HTML-limited crawlers`, async ({
    page,
    request,
    baseURL,
  }) => {
    for (const query of ["", "?unknown=value"]) {
      const response = await request.get(`/${locale}/listings${query}`, {
        headers: { "User-Agent": "facebookexternalhit/1.1" },
      });
      expect(response.status()).toBe(200);
      const metadata = await page.evaluate(
        (html) => {
          const head = new DOMParser().parseFromString(html, "text/html").head;
          return {
            titles: Array.from(
              head.querySelectorAll("title"),
              (node) => node.textContent
            ),
            descriptions: Array.from(
              head.querySelectorAll('meta[name="description"]'),
              (node) => node.getAttribute("content")
            ),
            canonicals: Array.from(
              head.querySelectorAll('link[rel="canonical"]'),
              (node) => node.getAttribute("href")
            ),
            languages: Array.from(
              head.querySelectorAll('link[rel="alternate"][hreflang]'),
              (node) => [
                node.getAttribute("hreflang"),
                node.getAttribute("href"),
              ]
            ),
            robots: Array.from(
              head.querySelectorAll('meta[name="robots"]'),
              (node) => node.getAttribute("content")
            ),
          };
        },
        await response.text()
      );
      expect(metadata).toEqual({
        titles: [dictionary.metadata.listings.title],
        descriptions: [dictionary.metadata.listings.description],
        canonicals: [`${baseURL}/${locale}/listings`],
        languages: [
          ["mk", `${baseURL}/mk/listings`],
          ["en", `${baseURL}/en/listings`],
        ],
        robots: [query ? "noindex, follow" : "index, follow"],
      });
    }
  });

  test(`${locale} catalog semantic audit covers results, pagination, empty states, and failures`, async ({
    page,
    request,
    baseURL,
  }) => {
    const control = "http://localhost:5231/__test/listings-failure";
    const audit = async () => {
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: dictionary.listings.title,
          exact: true,
        })
      ).toHaveCount(1);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        scan.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical"
        )
      ).toEqual([]);
    };
    await page.goto(`/${locale}/listings`);
    await page
      .getByRole("button", {
        name: locale === "en" ? dictionary.theme.dark : dictionary.theme.light,
        exact: true,
      })
      .click();
    const search = page.getByRole("search", {
      name: dictionary.listings.search,
    });
    const keyword = search.getByRole("searchbox", {
      name: dictionary.listings.searchLabel,
    });
    await keyword.focus();
    await page.keyboard.press("Tab");
    await expect(
      search.getByRole("combobox", { name: dictionary.listings.listingType })
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      search.getByRole("combobox", { name: dictionary.listings.propertyType })
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      search.getByRole("button", {
        name: dictionary.listings.search,
        exact: true,
      })
    ).toBeFocused();
    const results = page.getByRole("region", {
      name: dictionary.listings.results,
      exact: true,
    });
    await expect(results.getByRole("article")).toHaveCount(4);
    await expect(
      results.locator('[role="status"], [role="alert"], [aria-live]')
    ).toHaveCount(0);
    const fallbackCard = results.getByRole("article", {
      name: "Стан во Центар",
    });
    await expect(
      fallbackCard
        .getByRole("heading", { level: 2, name: "Стан во Центар" })
        .locator("..")
    ).toHaveAttribute("lang", "mk");
    await expect(fallbackCard.locator("a, button, [tabindex]")).toHaveCount(0);
    await expect(
      fallbackCard.locator('img[alt=""]').or(
        fallbackCard.getByText(dictionary.listings.imageUnavailable, {
          exact: true,
        })
      )
    ).toBeVisible();
    await expect(fallbackCard.locator('img:not([alt=""])')).toHaveCount(0);
    await audit();

    await page.goto(`/${locale}/listings?q=Paged&page=2`);
    const pagination = page.getByRole("navigation", {
      name: dictionary.listings.pagination,
    });
    await expect(
      pagination.getByRole("link", {
        name: dictionary.listings.previousPage,
        exact: true,
      })
    ).toBeVisible();
    await expect(
      pagination.getByRole("link", {
        name: dictionary.listings.nextPage,
        exact: true,
      })
    ).toHaveCount(0);
    await expect(pagination.locator('[aria-current="page"]')).toHaveText(
      dictionary.listings.pageOf
        .replace("{page}", "2")
        .replace("{totalPages}", "2")
    );
    await audit();

    await page.goto(
      `/${locale}/listings?listingType=Rent&propertyType=Apartment`
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: dictionary.listings.emptyTitle,
      })
    ).toBeVisible();
    await audit();

    expect(
      (await request.post(`${control}?lang=${locale}&mode=server`)).ok()
    ).toBe(true);
    try {
      await page.goto(`/${locale}/listings`);
      const error = page.getByRole("alert", {
        name: dictionary.listings.failure.title,
      });
      await expect(error.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(
        error.getByText("fixture-server-request-id", { exact: true })
      ).toBeVisible();
      await expect(results).toHaveCount(0);
      await expectCatalogMetadata(page, locale, dictionary, baseURL!, true);
      const { requests } = await (await request.get(control)).json();
      expect(requests).toEqual([{ lang: locale, pageSize: "20" }]);
      await audit();
    } finally {
      await request.delete(control);
    }
  });

  for (const { mode, message, requestId } of [
    {
      mode: "validation",
      message: "validation",
      requestId: "fixture-validation-trace-id",
    },
    {
      mode: "server",
      message: "server",
      requestId: "fixture-server-request-id",
    },
    { mode: "http", message: "http", requestId: null },
    { mode: "invalid-json", message: "malformed", requestId: null },
    { mode: "malformed", message: "malformed", requestId: null },
    { mode: "network", message: "network", requestId: null },
  ] as const) {
    test(`${locale} presents classified ${mode} failures without fake results`, async ({
      page,
      request,
      context,
    }) => {
      const control = "http://localhost:5231/__test/listings-failure";
      expect(
        (await request.post(`${control}?lang=${locale}&mode=${mode}`)).ok()
      ).toBe(true);
      const browserApiRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).port === "5231")
          browserApiRequests.push(request.url());
      });
      try {
        await page.goto(
          `/${locale}/listings?q=Family&listingType=Rent&propertyType=House`
        );
        const error = page.getByRole("alert", {
          name: dictionary.listings.failure.title,
        });
        await expect(error).toHaveCount(1);
        await expect(error).toContainText(dictionary.listings.failure[message]);
        await expect(
          error.getByRole("button", { name: dictionary.errors.retry })
        ).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(page.getByRole("article")).toHaveCount(0);
        await expect(
          page.getByRole("region", {
            name: dictionary.listings.results,
            exact: true,
          })
        ).toHaveCount(0);
        await expect(
          page.getByRole("navigation", { name: dictionary.listings.pagination })
        ).toHaveCount(0);
        await expect(page.getByRole("searchbox")).toHaveValue("Family");
        await expect(page.locator("main")).not.toContainText(
          /Sensitive|private.example|Unusable listing|different-body-trace-id/
        );
        if (requestId) {
          await expect(
            error.getByText(requestId, { exact: true })
          ).toBeVisible();
          await context.grantPermissions(["clipboard-read", "clipboard-write"]);
          await error
            .getByRole("button", { name: dictionary.errors.copyRequestId })
            .click();
          await expect(page.getByRole("status")).toHaveText(
            dictionary.errors.requestIdCopied
          );
          expect(
            await page.evaluate(() => navigator.clipboard.readText())
          ).toBe(requestId);
        } else {
          await expect(
            error.getByText(dictionary.errors.requestIdLabel)
          ).toHaveCount(0);
          await expect(
            error.getByRole("button", { name: dictionary.errors.copyRequestId })
          ).toHaveCount(0);
        }
        for (const width of [320, 360]) {
          await page.setViewportSize({ width, height: 800 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth)
          ).toBeLessThanOrEqual(width);
        }
        expect(browserApiRequests).toEqual([]);
      } finally {
        await request.delete(control);
      }
    });
  }

  for (const latestSucceeded of [true, false]) {
    test(`${locale} latest overlapping clipboard attempt wins (success=${latestSucceeded})`, async ({
      page,
      request,
    }) => {
      const control = "http://localhost:5231/__test/listings-failure";
      expect(
        (await request.post(`${control}?lang=${locale}&mode=server`)).ok()
      ).toBe(true);
      try {
        await page.goto(`/${locale}/listings`);
        const error = page.getByRole("alert", {
          name: dictionary.listings.failure.title,
        });
        const copy = error.getByRole("button", {
          name: dictionary.errors.copyRequestId,
        });
        await expect(copy).toBeVisible();
        const attempts = await page.evaluateHandle(() => {
          const pending: {
            value: string;
            resolve: () => void;
            reject: (reason: Error) => void;
          }[] = [];
          Object.defineProperty(navigator.clipboard, "writeText", {
            configurable: true,
            value: (value: string) =>
              new Promise<void>((resolve, reject) => {
                pending.push({ value, resolve, reject });
              }),
          });
          return pending;
        });
        try {
          await copy.click();
          await copy.click();
          expect(
            await attempts.evaluate((pending) =>
              pending.map(({ value }) => value)
            )
          ).toEqual(["fixture-server-request-id", "fixture-server-request-id"]);
          await expect(page.getByRole("status")).toHaveCount(0);

          await attempts.evaluate((pending, succeeded) => {
            const latest = pending[1];
            if (!latest)
              throw new Error("Expected the second clipboard attempt");
            if (succeeded) latest.resolve();
            else latest.reject(new Error("Latest copy failed"));
          }, latestSucceeded);
          const message = latestSucceeded
            ? dictionary.errors.requestIdCopied
            : dictionary.errors.requestIdCopyFailed;
          await expect(page.getByRole("status")).toHaveText(message);

          await attempts.evaluate(async (pending, succeeded) => {
            const first = pending[0];
            if (!first) throw new Error("Expected the first clipboard attempt");
            if (succeeded) first.reject(new Error("Superseded copy failed"));
            else first.resolve();
            // Flush the clipboard continuation and React's scheduled update.
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve())
            );
          }, latestSucceeded);
          await expect(page.getByRole("status")).toHaveText(message);
          await expect(
            error.getByText("fixture-server-request-id", { exact: true })
          ).toBeVisible();
        } finally {
          await attempts.dispose();
        }
      } finally {
        await request.delete(control);
      }
    });
  }

  test(`${locale} clears stale clipboard feedback when retry changes the support ID`, async ({
    page,
    request,
    context,
    baseURL,
  }) => {
    const control = "http://localhost:5231/__test/listings-failure";
    expect(
      (await request.post(`${control}?lang=${locale}&mode=server`)).ok()
    ).toBe(true);
    try {
      const path = `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House&page=2`;
      await page.goto(path);
      const error = page.getByRole("alert", {
        name: dictionary.listings.failure.title,
      });
      await expect(
        error.getByText("fixture-server-request-id", { exact: true })
      ).toBeVisible();
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await error
        .getByRole("button", { name: dictionary.errors.copyRequestId })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        dictionary.errors.requestIdCopied
      );
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "fixture-server-request-id"
      );

      expect(
        (await request.post(`${control}?lang=${locale}&mode=validation`)).ok()
      ).toBe(true);
      await error
        .getByRole("button", { name: dictionary.errors.retry })
        .click();
      await expect(
        error.getByText("fixture-validation-trace-id", { exact: true })
      ).toBeVisible();
      await expect(page).toHaveURL(`${baseURL}${path}`);
      await expect(page.getByRole("status")).toHaveCount(0);
      await expect(
        error.getByText("fixture-server-request-id", { exact: true })
      ).toHaveCount(0);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "fixture-server-request-id"
      );
      await error
        .getByRole("button", { name: dictionary.errors.copyRequestId })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        dictionary.errors.requestIdCopied
      );
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "fixture-validation-trace-id"
      );
    } finally {
      await request.delete(control);
    }
  });

  test(`${locale} retries the exact current URL with one fresh server retrieval`, async ({
    page,
    request,
    baseURL,
  }) => {
    const control = "http://localhost:5231/__test/listings-failure";
    expect(
      (
        await request.post(`${control}?lang=${locale}&mode=server&transient=1`)
      ).ok()
    ).toBe(true);
    const path = `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House&page=2`;
    const query = {
      lang: locale,
      q: "Paged",
      listingType: "Rent",
      propertyType: "House",
      page: "2",
      pageSize: "20",
    };
    const browserApiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).port === "5231")
        browserApiRequests.push(request.url());
    });
    try {
      await page.goto(path);
      const error = page.getByRole("alert", {
        name: dictionary.listings.failure.title,
      });
      await expect(error).toContainText(dictionary.listings.failure.server);
      await expect(error.getByText("fixture-server-request-id")).toBeVisible();
      expect(await (await request.get(control)).json()).toEqual({
        requests: [query],
      });
      await error
        .getByRole("button", { name: dictionary.errors.retry })
        .click();
      await expect(page).toHaveURL(`${baseURL}${path}`);
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText(
        "Paged family house 21"
      );
      await expect(error).toHaveCount(0);
      await expect(
        page.getByRole("region", {
          name: dictionary.listings.results,
          exact: true,
        })
      ).toContainText(
        locale === "en" ? "21 properties found" : "Пронајдени имоти: 21"
      );
      await expect(page.getByRole("searchbox")).toHaveValue("Paged");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
      await expect(
        page.getByRole("navigation", { name: dictionary.listings.pagination })
      ).toContainText(
        dictionary.listings.pageOf
          .replace("{page}", "2")
          .replace("{totalPages}", "2")
      );
      expect(await (await request.get(control)).json()).toEqual({
        requests: [query, query],
      });
      expect(browserApiRequests).toEqual([]);
    } finally {
      await request.delete(control);
    }
  });

  test(`${locale} retries a readable correlated failure without JavaScript`, async ({
    browser,
    request,
    baseURL,
  }) => {
    const control = "http://localhost:5231/__test/listings-failure";
    expect(
      (
        await request.post(`${control}?lang=${locale}&mode=server&transient=1`)
      ).ok()
    ).toBe(true);
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
    });
    try {
      const page = await context.newPage();
      const path = `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House&page=2`;
      await page.goto(path);
      const error = page.getByRole("alert", {
        name: dictionary.listings.failure.title,
      });
      await expect(error).toContainText(dictionary.listings.failure.server);
      await expect(error.getByText("fixture-server-request-id")).toBeVisible();
      await expect(error.getByRole("button")).toHaveCount(0);
      await error.getByRole("link", { name: dictionary.errors.retry }).click();
      await expect(page).toHaveURL(`${baseURL}${path}`);
      await expect(page.getByRole("article")).toBeVisible();
      await expect(page.getByRole("article")).toContainText(
        "Paged family house 21"
      );
      expect(
        await page
          .getByRole("article")
          .evaluate((article) => article.closest("[hidden]") === null)
      ).toBe(true);
      await expect(error).toHaveCount(0);
      const { requests } = await (await request.get(control)).json();
      expect(requests).toHaveLength(2);
      expect(requests[0]).toEqual(requests[1]);
    } finally {
      await context.close();
      await request.delete(control);
    }
  });

  test(`${locale} presents a clean empty catalog without reset advice`, async ({
    page,
    request,
    baseURL,
  }) => {
    const controlUrl = "http://localhost:5231/__test/catalog-empty";
    expect((await request.post(`${controlUrl}?lang=${locale}`)).ok()).toBe(
      true
    );
    try {
      const response = await page.goto(`/${locale}/listings`);
      expect(response?.status()).toBe(200);
      await expectCatalogMetadata(page, locale, dictionary, baseURL!, true);
      const empty = page.getByRole("region", {
        name: dictionary.listings.catalogEmptyTitle,
      });
      await expect(empty).toContainText(
        dictionary.listings.catalogEmptyDescription
      );
      await expect(empty.getByRole("link")).toHaveCount(0);
      await expect(
        page.getByRole("region", {
          name: dictionary.listings.results,
          exact: true,
        })
      ).toContainText(
        locale === "en" ? "0 properties found" : "Пронајдени имоти: 0"
      );
      await expect(page.getByRole("article")).toHaveCount(0);
      await expect(
        page.getByRole("navigation", { name: dictionary.listings.pagination })
      ).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: dictionary.listings.clearSearch })
      ).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("status")).toHaveCount(0);
      for (const theme of [dictionary.theme.light, dictionary.theme.dark]) {
        await page.getByRole("button", { name: theme, exact: true }).click();
        for (const width of [320, 360]) {
          await page.setViewportSize({ width, height: 800 });
          await expect(empty).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth)
          ).toBeLessThanOrEqual(width);
        }
      }
      await page
        .getByRole("searchbox", { name: dictionary.listings.searchLabel })
        .fill("Family");
      await page
        .getByRole("button", { name: dictionary.listings.search, exact: true })
        .click();
      const filtered = page.getByRole("region", {
        name: dictionary.listings.emptyTitle,
      });
      await expect(filtered).toBeVisible();
      await filtered
        .getByRole("link", { name: dictionary.listings.clearSearch })
        .click();
      await expect(empty).toBeVisible();
    } finally {
      await request.delete(controlUrl);
    }
  });

  test(`${locale} recovers from filtered zero results and a positive-total empty page`, async ({
    page,
    baseURL,
  }) => {
    const browserApiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).port === "5231")
        browserApiRequests.push(request.url());
    });
    const zeroResponse = await page.goto(
      `/${locale}/listings?listingType=Rent&propertyType=Apartment&page=4`
    );
    expect(zeroResponse?.status()).toBe(200);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);
    const zero = page.getByRole("region", {
      name: dictionary.listings.emptyTitle,
    });
    await expect(zero).toContainText(dictionary.listings.emptyDescription);
    await expect(
      page.getByRole("region", {
        name: dictionary.listings.results,
        exact: true,
      })
    ).toContainText(
      locale === "en" ? "0 properties found" : "Пронајдени имоти: 0"
    );
    await expect(
      page.getByRole("navigation", { name: dictionary.listings.pagination })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: dictionary.listings.firstPage })
    ).toHaveCount(0);
    await expect(
      zero.getByRole("link", { name: dictionary.listings.clearSearch })
    ).toHaveAttribute("href", `/${locale}/listings`);
    await zero
      .getByRole("link", { name: dictionary.listings.clearSearch })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await expect(page.getByRole("article").first()).toContainText(
      "Стан во Центар"
    );

    const outPath = `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House&page=5&lang=${locale === "en" ? "mk" : "en"}&pageSize=99&sort=oldest`;
    const response = await page.goto(outPath);
    expect(response?.status()).toBe(200);
    await expectCatalogMetadata(page, locale, dictionary, baseURL!, false);
    await expect(page).toHaveURL(`${baseURL}${outPath}`);
    const emptyPage = page.getByRole("region", {
      name: dictionary.listings.emptyPageTitle,
    });
    await expect(emptyPage).toContainText(
      dictionary.listings.emptyPageDescription
    );
    await expect(
      page.getByRole("region", {
        name: dictionary.listings.results,
        exact: true,
      })
    ).toContainText(
      locale === "en" ? "21 properties found" : "Пронајдени имоти: 21"
    );
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: dictionary.listings.pagination })
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: dictionary.listings.catalogEmptyTitle })
    ).toHaveCount(0);
    await expect(zero).toHaveCount(0);
    const recovery = emptyPage.getByRole("link", {
      name: dictionary.listings.firstPage,
    });
    const firstPath = `/${locale}/listings?listingType=Rent&propertyType=House&q=Paged`;
    await expect(recovery).toHaveAttribute("href", firstPath);
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 800 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width);
    }
    await recovery.click();
    await expect(page).toHaveURL(`${baseURL}${firstPath}`);
    await expect(page.getByRole("article")).toHaveCount(20);
    await expect(page.getByRole("article").first()).toContainText(
      "Paged family house 01"
    );
    await expect(page.getByRole("article").last()).toContainText(
      "Paged family house 20"
    );
    await expect(page.getByRole("searchbox")).toHaveValue("Paged");
    await expect(
      page.getByRole("combobox", { name: dictionary.listings.listingType })
    ).toHaveValue("Rent");
    await expect(
      page.getByRole("combobox", { name: dictionary.listings.propertyType })
    ).toHaveValue("House");
    expect(browserApiRequests).toEqual([]);
  });

  test(`${locale} follows empty-result recovery links without JavaScript`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
    });
    try {
      const page = await context.newPage();
      await page.goto(
        `/${locale}/listings?listingType=Rent&propertyType=Apartment&page=3`
      );
      const zero = page.getByRole("region", {
        name: dictionary.listings.emptyTitle,
      });
      await expect(zero).toBeVisible();
      await zero
        .getByRole("link", { name: dictionary.listings.clearSearch })
        .click();
      await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
      await expect(page.getByRole("article")).toHaveCount(4);
      await page.goto(
        `/${locale}/listings?q=Family&listingType=Rent&propertyType=House&page=5`
      );
      const emptyPage = page.getByRole("region", {
        name: dictionary.listings.emptyPageTitle,
      });
      await expect(emptyPage).toBeVisible();
      await expect(page.getByRole("article")).toHaveCount(0);
      await expect(
        page.getByRole("navigation", { name: dictionary.listings.pagination })
      ).toHaveCount(0);
      await emptyPage
        .getByRole("link", { name: dictionary.listings.firstPage })
        .click();
      await expect(page).toHaveURL(
        `${baseURL}/${locale}/listings?listingType=Rent&propertyType=House&q=Family`
      );
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText("Family house");
      await expect(page.getByRole("article")).toBeVisible();
      expect(
        await page
          .getByRole("article")
          .evaluate((article) => article.closest("[hidden]") === null)
      ).toBe(true);
      await expect(page.getByRole("status")).toHaveCount(0);
      await expect(page.getByRole("searchbox")).toHaveValue("Family");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
    } finally {
      await context.close();
    }
  });

  test(`${locale} shows pagination pending feedback until results complete`, async ({
    page,
    request,
  }) => {
    const gateUrl = "http://localhost:5231/__test/listings-gate";
    const browserApiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).port === "5231")
        browserApiRequests.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/${locale}/listings?q=Paged&listingType=Rent&propertyType=House`
    );
    await expect(page.getByRole("article")).toHaveCount(20);
    expect((await request.post(`${gateUrl}?lang=${locale}&page=2`)).ok()).toBe(
      true
    );
    try {
      const navigation = page.getByRole("navigation", {
        name: dictionary.listings.pagination,
      });
      const next = navigation.getByRole("link", {
        name: dictionary.listings.nextPage,
        exact: true,
      });
      await next.click();
      await expect
        .poll(async () => (await (await request.get(gateUrl)).json()).pending)
        .toBe(1);
      const status = page.getByRole("status");
      await expect(status).toHaveCount(1);
      await expect(status).toHaveText(dictionary.listings.navigationPending);
      await expect(status).toBeVisible();
      await expect(next).toHaveAccessibleName(dictionary.listings.nextPage);
      await expect(next).toBeFocused();
      await expect(next).not.toHaveAttribute("aria-disabled");
      await expect(page.getByRole("article")).toHaveCount(20);
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width);
        expect(
          await status.evaluate(
            (element) => getComputedStyle(element).animationName
          )
        ).toBe("none");
      }
      await request.delete(gateUrl);
      await expect(page).toHaveURL(/page=2/);
      await expect(status).toHaveCount(0);
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText(
        "Paged family house 21"
      );
      await expect(navigation).toContainText(
        locale === "en" ? "Page 2 of 2" : "Страница 2 од 2"
      );
      await expect(page.getByRole("searchbox")).toHaveValue("Paged");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
      expect((await (await request.get(gateUrl)).json()).requests).toBe(1);
      expect(browserApiRequests).toEqual([]);
    } finally {
      await request.delete(gateUrl);
    }
  });

  test(`${locale} shows search pending feedback until filtered results complete`, async ({
    page,
    request,
  }) => {
    const gateUrl = "http://localhost:5231/__test/listings-gate";
    const browserApiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).port === "5231")
        browserApiRequests.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
    await request.post(`${gateUrl}?lang=${locale}&page=1`);
    try {
      const keyword = page.getByRole("searchbox", {
        name: dictionary.listings.searchLabel,
      });
      await keyword.fill("Paged");
      await page
        .getByRole("combobox", { name: dictionary.listings.listingType })
        .selectOption("Rent");
      await page
        .getByRole("combobox", { name: dictionary.listings.propertyType })
        .selectOption("House");
      const submit = page.getByRole("button", {
        name: dictionary.listings.search,
        exact: true,
      });
      if (locale === "en") await keyword.press("Enter");
      else await submit.click();
      await expect
        .poll(async () => (await (await request.get(gateUrl)).json()).pending)
        .toBe(1);
      const status = page.getByRole("status");
      await expect(status).toHaveCount(1);
      await expect(status).toHaveText(dictionary.listings.navigationPending);
      await expect(status).toBeVisible();
      await expect(submit).toHaveAccessibleName(dictionary.listings.search);
      await expect(submit).toBeEnabled();
      await expect(locale === "en" ? keyword : submit).toBeFocused();
      await expect(page.getByRole("article")).toHaveCount(4);
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width);
      }
      await request.delete(gateUrl);
      await expect(page.getByRole("article")).toHaveCount(20);
      await expect(page.getByRole("article").first()).toContainText(
        "Paged family house 01"
      );
      await expect(status).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: dictionary.listings.results })
      ).toContainText(
        locale === "en" ? "21 properties found" : "Пронајдени имоти: 21"
      );
      await expect(keyword).toHaveValue("Paged");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
      expect((await (await request.get(gateUrl)).json()).requests).toBe(1);
      expect(browserApiRequests).toEqual([]);
    } finally {
      await request.delete(gateUrl);
    }
  });

  test(`${locale} completes direct, keyword, filtered and paginated GET navigation without JavaScript`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
    });
    try {
      const page = await context.newPage();
      await page.goto(`/${locale}/listings`);
      await expect(page.getByRole("article")).toHaveCount(4);
      await expect(page.getByRole("article").first()).toBeVisible();
      expect(
        await page
          .locator("article")
          .evaluateAll((articles) =>
            articles.every((article) => article.closest("[hidden]") === null)
          )
      ).toBe(true);
      await expect(page.getByRole("status")).toHaveCount(0);
      const keyword = page.getByRole("searchbox", {
        name: dictionary.listings.searchLabel,
      });
      await keyword.fill("Family");
      await keyword.press("Enter");
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText("Family house");
      await page
        .getByRole("link", { name: dictionary.listings.clearSearch })
        .click();
      await keyword.fill("Paged");
      await page
        .getByRole("combobox", { name: dictionary.listings.listingType })
        .selectOption("Rent");
      await page
        .getByRole("combobox", { name: dictionary.listings.propertyType })
        .selectOption("House");
      await keyword.press("Enter");
      await expect(page.getByRole("article")).toHaveCount(20);
      await page
        .getByRole("link", { name: dictionary.listings.nextPage })
        .click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole("article")).toHaveCount(1);
      await expect(page.getByRole("article")).toContainText(
        "Paged family house 21"
      );
      await expect(page.getByRole("article")).toBeVisible();
      await expect(keyword).toHaveValue("Paged");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.listingType })
      ).toHaveValue("Rent");
      await expect(
        page.getByRole("combobox", { name: dictionary.listings.propertyType })
      ).toHaveValue("House");
      await expect(page.getByRole("status")).toHaveCount(0);
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width);
      }
    } finally {
      await context.close();
    }
  });

  test(`${locale} renders backend-shaped public listing cards without browser API requests`, async ({
    page,
  }) => {
    const browserApiRequests: string[] = [];
    const unsafeMediaRequests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.port === "5231") {
        browserApiRequests.push(request.url());
      }
      if (url.hostname === "outside.example") {
        unsafeMediaRequests.push(request.url());
      }
    });

    const response = await page.goto(`/${locale}/listings`);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(
      page.getByRole("heading", { level: 1, name: dictionary.listings.title })
    ).toBeVisible();

    const results = page.getByRole("region", {
      name: dictionary.listings.results,
    });
    const cards = results.getByRole("article");
    await expect(cards).toHaveCount(4);
    await expect(results).toContainText(
      locale === "en" ? "4 properties found" : "Пронајдени имоти: 4"
    );
    await expect(cards.nth(1)).toContainText("Family house");
    await expect(cards.nth(2)).toContainText("Office by the square");
    await expect(cards.nth(3)).toContainText("Градежно земјиште");

    await expect(cards.nth(0)).toContainText("Стан во Центар");
    const preview = cards.nth(0).locator("img");
    await expect(preview).toHaveAttribute("alt", "");
    await expect(preview).toHaveAttribute("src", /\/_next\/image\?/);
    await preview.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        preview.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
        )
      )
      .toBe(true);
    await expect(cards.nth(0)).toContainText("Дебар Маало, Центар, Скопје");
    await expect(cards.nth(0)).toContainText(
      `${dictionary.listings.listingTypes.Sale} · ${dictionary.listings.propertyTypes.Apartment}`
    );
    await expect(cards.nth(0)).toContainText(
      formatPrice(145000, "EUR", locale)
    );
    await expect(cards.nth(0)).toContainText(
      formatAreaSquareMeters(82.5, locale)
    );
    await expect(
      cards.nth(0).locator("[lang]", { hasText: "Стан во Центар" })
    ).toHaveAttribute("lang", "mk");

    await expect(cards.nth(1)).toContainText("Family house");
    await expect(
      cards.nth(1).getByText(dictionary.listings.imageUnavailable)
    ).toBeVisible();
    await expect(cards.nth(1).locator("img")).toHaveCount(0);
    await expect(cards.nth(1)).toContainText(
      dictionary.listings.propertyTypes.House
    );
    await expect(
      cards.nth(1).locator("[lang]", { hasText: "Family house" })
    ).toHaveAttribute("lang", "en");
    await expect(cards.nth(2)).toContainText(
      dictionary.listings.propertyTypes.Commercial
    );
    await expect(
      cards.nth(2).getByText(dictionary.listings.imageUnavailable)
    ).toBeVisible();
    await expect(cards.nth(2).locator("img")).toHaveCount(0);
    await expect(
      cards.nth(2).getByText("Bitola", { exact: true })
    ).toBeVisible();
    await expect(cards.nth(2)).not.toContainText("Bitola, Bitola");
    await expect(cards.nth(3)).toContainText(
      dictionary.listings.propertyTypes.Land
    );
    await expect(
      cards.nth(3).getByText(dictionary.listings.imageUnavailable)
    ).toBeVisible();
    await expect(cards.nth(3).locator("img")).toHaveCount(0);
    await expect(
      cards.nth(3).getByText("Охрид", { exact: true })
    ).toBeVisible();
    await expect(cards.nth(3)).not.toContainText("Охрид, Охрид");
    await expect(cards.nth(0).getByRole("link")).toHaveCount(0);
    const frames = cards.locator('div[class*="aspect-"]');
    await expect(frames).toHaveCount(4);
    const sizes = await Promise.all(
      [0, 1, 2, 3].map((index) => frames.nth(index).boundingBox())
    );
    for (const size of sizes) {
      expect(size).not.toBeNull();
      expect(size!.width / size!.height).toBeCloseTo(4 / 3, 1);
      expect(size!.width).toBeCloseTo(sizes[0]!.width, 0);
      expect(size!.height).toBeCloseTo(sizes[0]!.height, 0);
    }
    expect(browserApiRequests).toEqual([]);
    expect(unsafeMediaRequests).toEqual([]);
  });

  test(`${locale} submits a keyword and clears back to the clean catalog`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(`/${locale}/listings`);

    const input = page.getByRole("searchbox", {
      name: dictionary.listings.searchLabel,
    });
    await input.fill("Family");

    if (locale === "en") {
      await input.press("Enter");
    } else {
      await page
        .getByRole("button", { name: dictionary.listings.search })
        .click();
    }

    await expect(page).toHaveURL(new RegExp(`/${locale}/listings\\?q=Family`));
    expect(new URL(page.url()).searchParams.has("page")).toBe(false);
    await expect(input).toHaveValue("Family");
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Family house");

    await page
      .getByRole("link", { name: dictionary.listings.clearSearch })
      .click();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
  });

  test(`${locale} submits combined filters and resets to the clean catalog`, async ({
    page,
    baseURL,
  }) => {
    const browserApiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).port === "5231") {
        browserApiRequests.push(request.url());
      }
    });

    await page.goto(`/${locale}/listings?q=x&page=3`);
    const keyword = page.getByRole("searchbox", {
      name: dictionary.listings.searchLabel,
    });
    const listingType = page.getByRole("combobox", {
      name: dictionary.listings.listingType,
    });
    const propertyType = page.getByRole("combobox", {
      name: dictionary.listings.propertyType,
    });
    await expect(listingType).toHaveValue("");
    await expect(propertyType).toHaveValue("");
    await expect(
      listingType.getByRole("option", {
        name: dictionary.listings.allListingTypes,
      })
    ).toHaveAttribute("value", "");
    await expect(
      propertyType.getByRole("option", {
        name: dictionary.listings.allPropertyTypes,
      })
    ).toHaveAttribute("value", "");
    await keyword.fill("Family");
    await listingType.selectOption("Rent");
    await propertyType.selectOption("House");
    await page
      .getByRole("button", { name: dictionary.listings.search })
      .click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/listings\\?q=Family`));
    const url = new URL(page.url());
    expect(url.searchParams.get("q")).toBe("Family");
    expect(url.searchParams.get("listingType")).toBe("Rent");
    expect(url.searchParams.get("propertyType")).toBe("House");
    expect(url.searchParams.has("page")).toBe(false);
    await expect(keyword).toHaveValue("Family");
    await expect(listingType).toHaveValue("Rent");
    await expect(propertyType).toHaveValue("House");
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article")).toContainText("Family house");
    await expect(
      page.getByRole("region", { name: dictionary.listings.results })
    ).toContainText(
      locale === "en" ? "1 property found" : "Пронајден е 1 имот"
    );
    expect(browserApiRequests).toEqual([]);

    await page.getByRole("link", { name: dictionary.listings.reset }).click();
    await expect(page).toHaveURL(`${baseURL}/${locale}/listings`);
    await expect(keyword).toHaveValue("");
    await expect(listingType).toHaveValue("");
    await expect(propertyType).toHaveValue("");
    await expect(page.getByRole("article")).toHaveCount(4);

    await listingType.selectOption("Rent");
    await page
      .getByRole("button", { name: dictionary.listings.search })
      .click();
    await expect(page).toHaveURL(/listingType=Rent/);
    expect(new URL(page.url()).searchParams.get("listingType")).toBe("Rent");
    await expect(listingType).toHaveValue("Rent");
    await expect(propertyType).toHaveValue("");
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("article").nth(0)).toContainText(
      "Family house"
    );
    await expect(page.getByRole("article").nth(1)).toContainText(
      "Office by the square"
    );

    await listingType.selectOption("");
    await propertyType.selectOption("Apartment");
    await page
      .getByRole("button", { name: dictionary.listings.search })
      .click();
    await expect(page).toHaveURL(/propertyType=Apartment/);
    expect(new URL(page.url()).searchParams.get("propertyType")).toBe(
      "Apartment"
    );
    await expect(listingType).toHaveValue("");
    await expect(propertyType).toHaveValue("Apartment");
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article")).toContainText("Стан во Центар");

    await listingType.selectOption("Rent");
    await page
      .getByRole("button", { name: dictionary.listings.search })
      .click();
    await expect(page).toHaveURL(/listingType=Rent.*propertyType=Apartment/);
    const combinedUrl = new URL(page.url());
    expect(combinedUrl.searchParams.get("q")).toBe("");
    expect(combinedUrl.searchParams.get("listingType")).toBe("Rent");
    expect(combinedUrl.searchParams.get("propertyType")).toBe("Apartment");
    await expect(keyword).toHaveValue("");
    await expect(listingType).toHaveValue("Rent");
    await expect(propertyType).toHaveValue("Apartment");
    await expect(
      page.getByRole("region", { name: dictionary.listings.results })
    ).toHaveCount(1);
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: dictionary.listings.results })
    ).toContainText(
      locale === "en" ? "0 properties found" : "Пронајдени имоти: 0"
    );
    expect(browserApiRequests).toEqual([]);

    await page.setViewportSize({ width: 360, height: 800 });
    await expect(keyword).toBeVisible();
    await expect(listingType).toBeVisible();
    await expect(propertyType).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(360);
  });
}

test("catalog grid reflows in backend order without clipping long content", async ({
  page,
}) => {
  await page.goto("/en/listings");
  const cards = page
    .getByRole("region", { name: en.listings.results })
    .getByRole("article");
  await expect(cards).toHaveCount(4);

  const longText = "Averylonglistingword".repeat(8);
  await cards
    .first()
    .locator("h2")
    .evaluate((heading, value) => {
      heading.textContent = value;
    }, longText);
  await cards
    .first()
    .locator("[lang] p")
    .evaluate((location, value) => {
      location.textContent = value;
    }, longText);

  for (const [width, columns] of [
    [320, 1],
    [360, 1],
    [768, 2],
    [1280, 3],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await Promise.all(
      [0, 1, 2, 3].map((index) => cards.nth(index).boundingBox())
    );
    expect(boxes.every(Boolean)).toBe(true);
    expect(
      new Set(boxes.slice(0, columns).map((box) => Math.round(box!.x))).size
    ).toBe(columns);
    expect(
      new Set(boxes.slice(0, columns).map((box) => Math.round(box!.y))).size
    ).toBe(1);
    expect(Math.round(boxes[columns]!.x)).toBe(Math.round(boxes[0]!.x));
    expect(boxes[columns]!.y).toBeGreaterThan(boxes[0]!.y);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width);
    expect(
      await cards.evaluateAll((articles) =>
        articles.every(
          (article) => article.scrollWidth <= article.clientWidth + 1
        )
      )
    ).toBe(true);
    const media = cards.first().locator('div[class*="aspect-"]');
    const frame = await media.boundingBox();
    expect(frame).not.toBeNull();
    expect(frame!.width / frame!.height).toBeCloseTo(4 / 3, 1);
  }
});

test("previous and next preserve filtered catalog state and backend page identities", async ({
  page,
  baseURL,
  request,
}) => {
  test.setTimeout(60_000);
  const browserApiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "5231") {
      browserApiRequests.push(request.url());
    }
  });

  await request.delete(observedRequestsUrl);
  await page.goto("/en/listings");
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(
    page.getByRole("region", { name: en.listings.results })
  ).toContainText("4 properties found");
  await expectListingsRequest(request, { lang: "en", pageSize: "20" });
  const keyword = page.getByRole("searchbox", {
    name: en.listings.searchLabel,
  });
  await request.delete(observedRequestsUrl);
  await keyword.fill(" Paged ");
  await keyword.press("Enter");
  await expect(page.getByRole("article")).toHaveCount(20);
  await expect(keyword).toHaveValue("Paged");
  expect(new URL(page.url()).searchParams.get("q")?.trim()).toBe("Paged");
  await expectListingsRequest(request, {
    lang: "en",
    pageSize: "20",
    q: "Paged",
  });
  await request.delete(observedRequestsUrl);
  await page.reload();
  await expect(keyword).toHaveValue("Paged");
  await expectListingsRequest(request, {
    lang: "en",
    pageSize: "20",
    q: "Paged",
  });
  await page
    .getByRole("navigation", { name: en.listings.pagination })
    .getByRole("link", { name: en.listings.nextPage })
    .click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText(
    "Paged family house 21"
  );
  await page
    .getByRole("combobox", { name: en.listings.listingType })
    .selectOption("Rent");
  await page
    .getByRole("combobox", { name: en.listings.propertyType })
    .selectOption("House");
  await request.delete(observedRequestsUrl);
  await page
    .getByRole("button", { name: en.listings.search, exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(20);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await expectListingsRequest(request, {
    lang: "en",
    pageSize: "20",
    q: "Paged",
    listingType: "Rent",
    propertyType: "House",
  });
  const canonicalFirstUrl = `${baseURL}/en/listings?listingType=Rent&propertyType=House&q=Paged`;
  const cards = page
    .getByRole("region", { name: en.listings.results })
    .getByRole("article");
  const pagination = page.getByRole("navigation", {
    name: en.listings.pagination,
  });
  await expect(cards).toHaveCount(20);
  await expect(cards.first()).toContainText("Paged family house 01");
  await expect(cards.last()).toContainText("Paged family house 20");
  await expect(
    page.getByRole("region", { name: en.listings.results })
  ).toContainText("21 properties found");
  await expect(pagination).toContainText("Page 1 of 2");
  await expect(
    pagination.getByRole("link", { name: en.listings.previousPage })
  ).toHaveCount(0);

  await request.delete(observedRequestsUrl);
  await pagination.getByRole("link", { name: en.listings.nextPage }).click();
  await expect(page).toHaveURL(/page=2/);
  const secondUrl = new URL(page.url());
  expect(secondUrl.pathname).toBe("/en/listings");
  expect(secondUrl.searchParams.get("q")).toBe("Paged");
  expect(secondUrl.searchParams.get("listingType")).toBe("Rent");
  expect(secondUrl.searchParams.get("propertyType")).toBe("House");
  expect(secondUrl.searchParams.getAll("page")).toEqual(["2"]);
  expect(secondUrl.searchParams.has("pageSize")).toBe(false);
  expect(secondUrl.searchParams.has("lang")).toBe(false);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Paged family house 21");
  await expectListingsRequest(request, {
    lang: "en",
    pageSize: "20",
    page: "2",
    q: "Paged",
    listingType: "Rent",
    propertyType: "House",
  });
  await expect(pagination).toContainText("Page 2 of 2");
  await expect(
    pagination.getByRole("link", { name: en.listings.nextPage })
  ).toHaveCount(0);
  await expect(
    page.getByRole("searchbox", { name: en.listings.searchLabel })
  ).toHaveValue("Paged");
  await expect(
    page.getByRole("combobox", { name: en.listings.listingType })
  ).toHaveValue("Rent");
  await expect(
    page.getByRole("combobox", { name: en.listings.propertyType })
  ).toHaveValue("House");

  for (const width of [320, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(
      pagination.getByRole("link", { name: en.listings.previousPage })
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width);
  }

  await pagination
    .getByRole("link", { name: en.listings.previousPage })
    .click();
  await expect(page).toHaveURL(canonicalFirstUrl);
  await expect(cards).toHaveCount(20);
  await expect(cards.first()).toContainText("Paged family house 01");
  await page.goBack();
  await expect(page).toHaveURL(secondUrl.toString());
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Paged family house 21");
  const preservedQuery = new URL(page.url()).search;
  await request.delete(observedRequestsUrl);
  await page
    .getByRole("navigation", { name: en.locale.label })
    .getByRole("link", { name: en.locale.mk, exact: true })
    .click();
  await expect(page).toHaveURL(`${baseURL}/mk/listings${preservedQuery}`);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: mk.listings.title,
      exact: true,
    })
  ).toBeVisible();
  await expect(page.getByRole("article")).toContainText(
    "Paged family house 21"
  );
  await expectListingsRequest(request, {
    lang: "mk",
    pageSize: "20",
    page: "2",
    q: "Paged",
    listingType: "Rent",
    propertyType: "House",
  });
  await request.delete(observedRequestsUrl);
  expect(browserApiRequests).toEqual([]);
});

test("pagination omits navigation for single and out-of-range pages", async ({
  page,
}) => {
  await page.goto("/en/listings");
  await expect(
    page.getByRole("navigation", { name: en.listings.pagination })
  ).toHaveCount(0);

  await page.goto("/en/listings?q=Paged&page=3");
  await expect(
    page.getByRole("region", { name: en.listings.results, exact: true })
  ).toContainText("21 properties found");
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: en.listings.pagination })
  ).toHaveCount(0);
});

test("pagination links navigate without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    await page.goto("/mk/listings?q=Paged&listingType=Rent&propertyType=House");
    const pagination = page.getByRole("navigation", {
      name: mk.listings.pagination,
    });
    await expect(pagination).toContainText("Страница 1 од 2");
    await pagination.getByRole("link", { name: mk.listings.nextPage }).click();
    await expect(page).toHaveURL(/\/mk\/listings\?.*page=2/);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article")).toContainText(
      "Paged family house 21"
    );
    await expect(pagination).toContainText("Страница 2 од 2");
  } finally {
    await context.close();
  }
});

test("invalid direct keyword shows feedback and Enter submission resets page", async ({
  page,
}) => {
  await page.goto("/en/listings?q=x&page=4");

  const input = page.getByRole("searchbox", {
    name: en.listings.searchLabel,
  });
  await expect(input).toHaveValue("x");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(en.listings.searchTooShort)).toBeVisible();
  await expect(
    page.getByText(en.listings.searchInvalidSummary)
  ).toHaveAttribute("role", "alert");
  await expect(page.getByRole("article")).toHaveCount(0);

  await input.fill("Family");
  await input.press("Enter");

  await expect(page).toHaveURL(/\/en\/listings\?q=Family/);
  await expect(page.getByRole("article")).toHaveCount(1);
});

test("combined search remains a native GET when JavaScript is disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    await page.goto("/en/listings");
    const input = page.getByRole("searchbox", {
      name: en.listings.searchLabel,
    });
    await input.fill("Family");
    await page
      .getByRole("combobox", { name: en.listings.listingType })
      .selectOption("Rent");
    await page
      .getByRole("combobox", { name: en.listings.propertyType })
      .selectOption("House");
    await input.press("Enter");

    await expect(page).toHaveURL(/\/en\/listings\?q=Family/);
    const url = new URL(page.url());
    expect(url.searchParams.get("listingType")).toBe("Rent");
    expect(url.searchParams.get("propertyType")).toBe("House");
    expect(url.searchParams.has("page")).toBe(false);
    await expect(page.getByRole("article")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
