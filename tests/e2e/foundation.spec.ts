import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { en } from "../../src/i18n/dictionaries/en";
import { mk } from "../../src/i18n/dictionaries/mk";

const appOrigin = "http://127.0.0.1:3000";
const backendOrigin = "http://localhost:5231";
const localeCookieName = "realestate_locale";
const localeCases = [
  { locale: "mk", dictionary: mk },
  { locale: "en", dictionary: en },
] as const;
const explicitThemeCases = [
  { locale: "mk", dictionary: mk, theme: "light" },
  { locale: "en", dictionary: en, theme: "dark" },
] as const;
const reactScriptWarning =
  "Encountered a script tag while rendering React component.";
const hydrationWarningFragments = [
  "Hydration failed",
  "hydrated but some attributes",
  "did not match",
  "server rendered HTML",
] as const;

const backendRequests = new WeakMap<Page, string[]>();

test.beforeEach(async ({ context, page }) => {
  const requests: string[] = [];

  backendRequests.set(page, requests);
  page.on("request", (request) => {
    if (request.url().startsWith(backendOrigin)) {
      requests.push(request.url());
    }
  });

  await context.clearCookies();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "fr-FR,fr;q=0.9",
  });
});

test.afterEach(async ({ page }) => {
  expect(backendRequests.get(page) ?? []).toEqual([]);
});

async function tabTo(page: Page, target: Locator, maximumTabs = 15) {
  await expect(target).toBeEnabled();

  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press("Tab");

    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }

  throw new Error(`Control was not reached after ${maximumTabs} Tab presses`);
}

async function selectTheme(page: Page, label: string, theme: "light" | "dark") {
  const button = page.getByRole("button", { name: label });

  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator("html")).toHaveClass(
    new RegExp(`(^|\\s)${theme}(\\s|$)`)
  );
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

async function expectCorrectFirstThemeFrame(
  page: Page,
  storedTheme: "system" | "light" | "dark"
) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __firstThemeFrame?: {
                className: string;
                expectedTheme: "light" | "dark";
                storedTheme: string | null;
              };
            }
          ).__firstThemeFrame
      )
    )
    .not.toBeUndefined();

  const frame = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __firstThemeFrame?: {
            className: string;
            expectedTheme: "light" | "dark";
            storedTheme: string | null;
          };
        }
      ).__firstThemeFrame
  );

  expect(frame?.storedTheme ?? "system").toBe(storedTheme);
  expect(frame?.className.split(/\s+/)).toContain(frame?.expectedTheme);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1
  );
}

function channelLuminance(channel: number) {
  const normalized = channel / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function parseRgb(color: string): [number, number, number] {
  const channels = color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);

  if (!channels || channels.length !== 3) {
    throw new TypeError(`Unsupported rendered color: ${color}`);
  }

  return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0];
}

function contrastRatio(foreground: string, background: string) {
  const luminance = ([red, green, blue]: [number, number, number]) =>
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue);
  const foregroundLuminance = luminance(parseRgb(foreground));
  const backgroundLuminance = luminance(parseRgb(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

async function renderedPair(locator: Locator, colorProperty = "color") {
  return locator.evaluate((element, property) => {
    const style = getComputedStyle(element);
    let ancestor: Element | null =
      property === "outlineColor" ? element.parentElement : element;
    let background = "rgba(0, 0, 0, 0)";

    while (ancestor) {
      background = getComputedStyle(ancestor).backgroundColor;

      if (!background.endsWith(", 0)") && background !== "rgba(0, 0, 0, 0)") {
        break;
      }

      ancestor = ancestor.parentElement;
    }

    return {
      background,
      foreground:
        property === "outlineColor" ? style.outlineColor : style.color,
    };
  }, colorProperty);
}

test.describe("root locale redirect", () => {
  test("falls back to Macedonian without a valid cookie or supported language", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(`${appOrigin}/mk`);
  });

  test("uses a supported locale preference cookie", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      { name: localeCookieName, value: "en", url: appOrigin },
    ]);

    await page.goto("/");

    await expect(page).toHaveURL(`${appOrigin}/en`);
  });

  test("uses a supported browser language and preserves duplicate query values", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: appOrigin,
      locale: "en-US",
    });
    const page = await context.newPage();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith(backendOrigin)) {
        requests.push(request.url());
      }
    });

    await page.goto("/?source=one&source=two");

    await expect(page).toHaveURL(`${appOrigin}/en?source=one&source=two`);
    expect(requests).toEqual([]);
    await context.close();
  });
});

for (const { dictionary, locale } of localeCases) {
  test(`${locale} renders the localized canonical page and document language`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: dictionary.home.title })
    ).toBeVisible();
    await expect(page.getByText(dictionary.common.footerText)).toBeVisible();
  });
}

test("locale switching preserves route/query and persists through the proxy", async ({
  context,
  page,
}) => {
  await page.goto("/en?source=one&source=two");

  const macedonianLink = page.getByRole("link", {
    name: en.locale.mk,
  });
  await expect(macedonianLink).toHaveAttribute(
    "href",
    "/mk?source=one&source=two"
  );
  await macedonianLink.press("Enter");

  await expect(page).toHaveURL(`${appOrigin}/mk?source=one&source=two`);
  await expect(page.locator("html")).toHaveAttribute("lang", "mk");
  const localeCookie = (await context.cookies()).find(
    ({ name }) => name === localeCookieName
  );
  expect(localeCookie?.value).toBe("mk");

  await page.goto("/");
  await expect(page).toHaveURL(`${appOrigin}/mk`);
});

test("theme initialization, controls, persistence, and locale navigation remain warning-free", async ({
  page,
}) => {
  let phase = "initial load";
  const scriptWarnings: Array<{ phase: string; text: string }> = [];
  const hydrationWarnings: Array<{ phase: string; text: string }> = [];

  page.on("console", (message) => {
    const text = message.text();

    if (text.includes(reactScriptWarning)) {
      scriptWarnings.push({ phase, text });
    }

    if (hydrationWarningFragments.some((fragment) => text.includes(fragment))) {
      hydrationWarnings.push({ phase, text });
    }
  });

  await page.goto("/en");
  await page.evaluate(() => localStorage.removeItem("theme"));

  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      const storedTheme = localStorage.getItem("theme");
      const expectedTheme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

      (
        window as typeof window & {
          __firstThemeFrame?: {
            className: string;
            expectedTheme: "light" | "dark";
            storedTheme: string | null;
          };
        }
      ).__firstThemeFrame = {
        className: document.documentElement.className,
        expectedTheme,
        storedTheme,
      };
    });
  });

  phase = "system reload";
  await page.reload();
  await expectCorrectFirstThemeFrame(page, "system");

  const system = page.getByRole("button", { name: en.theme.system });
  const light = page.getByRole("button", { name: en.theme.light });
  const dark = page.getByRole("button", { name: en.theme.dark });

  await expect(system).toHaveAttribute("aria-pressed", "true");
  await expect(light).toHaveAttribute("aria-pressed", "false");
  await expect(dark).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);

  phase = "light selection";
  await tabTo(page, light);
  await expect(light).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/(^|\s)light(\s|$)/);
  await expect(light).toHaveAttribute("aria-pressed", "true");

  phase = "dark selection";
  await page.keyboard.press("Tab");
  await expect(dark).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  phase = "dark reload";
  await page.reload();
  await expectCorrectFirstThemeFrame(page, "dark");
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  phase = "locale navigation";
  await page.getByRole("link", { name: en.locale.mk }).click();
  await expect(page).toHaveURL(`${appOrigin}/mk`);
  await expect(page.locator("html")).toHaveAttribute("lang", "mk");
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(
    page.getByRole("button", { name: mk.theme.dark })
  ).toHaveAttribute("aria-pressed", "true");

  phase = "system selection";
  const macedonianSystem = page.getByRole("button", {
    name: mk.theme.system,
  });
  await macedonianSystem.click();
  await expect(macedonianSystem).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/(^|\s)light(\s|$)/);

  phase = "system persistence reload";
  await page.reload();
  await expectCorrectFirstThemeFrame(page, "system");
  await expect(page.locator("html")).toHaveClass(/(^|\s)light(\s|$)/);
  await expect(
    page.getByRole("button", { name: mk.theme.system })
  ).toHaveAttribute("aria-pressed", "true");

  expect(scriptWarnings).toEqual([]);
  expect(hydrationWarnings).toEqual([]);
});

test("skip link becomes visible and transfers focus to the real main landmark", async ({
  page,
}) => {
  await page.goto("/en");

  const skipLink = page.getByRole("link", {
    name: en.accessibility.skipToContent,
  });
  await page.keyboard.press("Tab");

  await expect(skipLink).toBeFocused();
  const skipBox = await skipLink.boundingBox();
  expect(skipBox?.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("Enter");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("id", "main-content");
  await expect(main).toBeFocused();
});

for (const { dictionary, locale } of localeCases) {
  test(`${locale} exposes localized landmarks, names, and logical headings`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);

    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(
      page.getByRole("navigation", {
        name: dictionary.accessibility.primaryNavigation,
      })
    ).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: dictionary.locale.label })
    ).toHaveCount(1);
    await expect(
      page.getByRole("group", { name: dictionary.theme.label })
    ).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);

    for (const name of [dictionary.locale.mk, dictionary.locale.en]) {
      await expect(page.getByRole("link", { name })).toHaveCount(1);
    }
    for (const name of [
      dictionary.theme.system,
      dictionary.theme.light,
      dictionary.theme.dark,
    ]) {
      await expect(page.getByRole("button", { name })).toHaveCount(1);
    }

    const headingLevels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((headings) =>
        headings
          .filter((heading) => {
            const style = getComputedStyle(heading);
            return style.display !== "none" && style.visibility !== "hidden";
          })
          .map((heading) => Number(heading.tagName.slice(1)))
      );

    expect(headingLevels[0]).toBe(1);
    expect(headingLevels.filter((level) => level === 1)).toHaveLength(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index] ?? 1).toBeLessThanOrEqual(
        (headingLevels[index - 1] ?? 1) + 1
      );
    }
  });

  test(`${locale} metadata is localized and uses the configured site origin`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);

    await expect(page).toHaveTitle(dictionary.metadata.home.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      dictionary.metadata.home.description
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${appOrigin}/${locale}`
    );
    for (const supportedLocale of ["mk", "en"] as const) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${supportedLocale}"]`)
      ).toHaveAttribute("href", `${appOrigin}/${supportedLocale}`);
    }
  });
}

for (const { dictionary, locale, theme } of explicitThemeCases) {
  test(`${locale} ${theme} supports complete keyboard focus and minimum touch targets`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await selectTheme(page, dictionary.theme[theme], theme);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(
      new RegExp(`(^|\\s)${theme}(\\s|$)`)
    );

    const expectedFocusOrder = [
      dictionary.accessibility.skipToContent,
      dictionary.common.appName,
      dictionary.navigation.home,
      dictionary.locale.mk,
      dictionary.locale.en,
      dictionary.theme.system,
      dictionary.theme.light,
      dictionary.theme.dark,
      dictionary.home.browseListings,
    ];

    for (const expectedName of expectedFocusOrder) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      await expect(focused).toHaveText(expectedName);
      const focusStyle = await focused.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
        };
      });
      expect(focusStyle.outlineStyle).not.toBe("none");
      expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3);
    }

    const undersizedTargets = await page
      .locator("a[href], button:not([disabled])")
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const rectangle = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const visible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rectangle.width > 0 &&
            rectangle.height > 0;

          return visible && (rectangle.width < 24 || rectangle.height < 24)
            ? [
                {
                  height: rectangle.height,
                  label: element.textContent?.trim() ?? element.tagName,
                  width: rectangle.width,
                },
              ]
            : [];
        })
      );
    expect(undersizedTargets).toEqual([]);
  });

  test(`${locale} ${theme} reflows at 200 percent equivalent and mobile width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 720 });
    await page.goto(`/${locale}`);
    await selectTheme(page, dictionary.theme[theme], theme);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 320, height: 800 });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: dictionary.home.title })
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: dictionary.locale.label })
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: dictionary.theme.label })
    ).toBeVisible();

    const horizontallyClipped = await page
      .locator("body *")
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const rectangle = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const visible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rectangle.width > 0 &&
            rectangle.height > 0;

          return visible &&
            (rectangle.left < -1 || rectangle.right > window.innerWidth + 1)
            ? [element.tagName]
            : [];
        })
      );
    expect(horizontallyClipped).toEqual([]);
  });

  test(`${locale} ${theme} honors reduced motion and remains usable`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await selectTheme(page, dictionary.theme[theme], theme);

    await expect(page.locator("html")).toHaveAttribute(
      "data-scroll-behavior",
      "smooth"
    );
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
    const maximumMotionMilliseconds = await page.evaluate(() => {
      const durationToMilliseconds = (duration: string) => {
        const value = Number.parseFloat(duration);
        return duration.endsWith("ms") ? value : value * 1000;
      };

      return Math.max(
        ...Array.from(document.querySelectorAll("a[href], button")).flatMap(
          (element) => {
            const style = getComputedStyle(element);
            return [style.animationDuration, style.transitionDuration]
              .flatMap((durations) => durations.split(","))
              .map((duration) => durationToMilliseconds(duration.trim()));
          }
        )
      );
    });
    expect(maximumMotionMilliseconds).toBeLessThanOrEqual(0.011);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test(`${locale} ${theme} rendered text, controls, and focus meet contrast`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await selectTheme(page, dictionary.theme[theme], theme);

    const primaryAction = page.getByRole("link", {
      name: dictionary.home.browseListings,
    });
    const focusTarget = page.getByRole("button", {
      name: dictionary.theme[theme],
    });
    await page.reload();
    await tabTo(page, focusTarget);

    const samples = [
      {
        minimum: 4.5,
        name: "body",
        pair: await renderedPair(page.locator("body")),
      },
      {
        minimum: 4.5,
        name: "muted-description",
        pair: await renderedPair(page.getByText(dictionary.home.description)),
      },
      {
        minimum: 4.5,
        name: "primary-action",
        pair: await renderedPair(primaryAction),
      },
      {
        minimum: 4.5,
        name: "surface-card",
        pair: await renderedPair(page.locator("article h3").first()),
      },
      {
        minimum: 3,
        name: "focus-ring",
        pair: await renderedPair(focusTarget, "outlineColor"),
      },
    ];

    for (const { minimum, name, pair } of samples) {
      const ratio = contrastRatio(pair.foreground, pair.background);
      console.log(
        `[contrast] ${theme} ${name}: ${pair.foreground} / ${pair.background} = ${ratio.toFixed(2)}:1`
      );
      expect(ratio, `${theme} ${name}`).toBeGreaterThanOrEqual(minimum);
    }
  });

  test(`${locale} ${theme} has no serious or critical axe violations`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await selectTheme(page, dictionary.theme[theme], theme);

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical"
    );
    console.log(
      `[axe] ${locale} ${theme}: ${results.violations.length} total, ${seriousOrCritical.length} serious/critical`
    );
    expect(seriousOrCritical).toEqual([]);
  });
}
