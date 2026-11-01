import { expect, test } from "@playwright/test";

import { en } from "../../src/i18n/dictionaries/en";
import { mk } from "../../src/i18n/dictionaries/mk";

const backendOrigin = "http://localhost:5231";
const localeCases = [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const;

for (const { dictionary, locale } of localeCases) {
  test(`${locale} renders the localized catalog route frame without backend access`, async ({
    page,
  }) => {
    const backendRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().startsWith(backendOrigin)) {
        backendRequests.push(request.url());
      }
    });

    const response = await page.goto(`/${locale}/listings`);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: dictionary.listings.title,
      })
    ).toBeVisible();
    await expect(page.getByText(dictionary.listings.subtitle)).toBeVisible();
    await expect(
      page.getByRole("link", { name: dictionary.navigation.listings })
    ).toHaveAttribute("href", `/${locale}/listings`);
    expect(backendRequests).toEqual([]);
  });
}
