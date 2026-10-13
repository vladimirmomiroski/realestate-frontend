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
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.port === "5231") {
        browserApiRequests.push(request.url());
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

    await expect(cards.nth(0)).toContainText("Стан во Центар");
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
      cards.nth(2).getByText("Bitola", { exact: true })
    ).toBeVisible();
    await expect(cards.nth(2)).not.toContainText("Bitola, Bitola");
    await expect(cards.nth(3)).toContainText(
      dictionary.listings.propertyTypes.Land
    );
    await expect(
      cards.nth(3).getByText("Охрид", { exact: true })
    ).toBeVisible();
    await expect(cards.nth(3)).not.toContainText("Охрид, Охрид");
    await expect(cards.nth(0).getByRole("link")).toHaveCount(0);
    expect(browserApiRequests).toEqual([]);
  });

  test(`${locale} submits a keyword and clears back to the clean catalog`, async ({
    page,
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

    await expect(page).toHaveURL(
      `http://127.0.0.1:3000/${locale}/listings?q=Family`
    );
    await expect(input).toHaveValue("Family");
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Family house");

    await page
      .getByRole("link", { name: dictionary.listings.clearSearch })
      .click();
    await expect(page).toHaveURL(`http://127.0.0.1:3000/${locale}/listings`);
    await expect(page.getByRole("article")).toHaveCount(4);
  });
}

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

  await expect(page).toHaveURL("http://127.0.0.1:3000/en/listings?q=Family");
  await expect(page.getByRole("article")).toHaveCount(1);
});

test("keyword search remains a native GET when JavaScript is disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    await page.goto("/en/listings");
    const input = page.getByRole("searchbox", {
      name: en.listings.searchLabel,
    });
    await input.fill("Family");
    await input.press("Enter");

    await expect(page).toHaveURL("http://127.0.0.1:3000/en/listings?q=Family");
    await expect(page.getByRole("article")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
