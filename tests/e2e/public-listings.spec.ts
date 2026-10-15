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
  }) => {
    const controlUrl = "http://localhost:5231/__test/catalog-empty";
    expect((await request.post(`${controlUrl}?lang=${locale}`)).ok()).toBe(
      true
    );
    try {
      const response = await page.goto(`/${locale}/listings`);
      expect(response?.status()).toBe(200);
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
