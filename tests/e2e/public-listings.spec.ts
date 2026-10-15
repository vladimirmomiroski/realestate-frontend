import { expect, test } from "@playwright/test";

import { en } from "../../src/i18n/dictionaries/en";
import { mk } from "../../src/i18n/dictionaries/mk";
import {
  formatAreaSquareMeters,
  formatPrice,
} from "../../src/features/listings/utils/listing-formatters";

const localeCases = [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const;

for (const { locale, dictionary } of localeCases) {
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
}) => {
  const browserApiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "5231") {
      browserApiRequests.push(request.url());
    }
  });

  const firstUrl = `${baseURL}/en/listings?q=Paged&listingType=Rent&propertyType=House`;
  const canonicalFirstUrl = `${baseURL}/en/listings?listingType=Rent&propertyType=House&q=Paged`;
  await page.goto(firstUrl);
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
    page.getByRole("region", { name: en.listings.results })
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
