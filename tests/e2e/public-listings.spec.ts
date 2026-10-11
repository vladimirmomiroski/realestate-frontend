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
}
