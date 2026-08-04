export const locales = ["mk", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "mk";

export const localeCookieName = "realestate_locale";

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && locales.some((locale) => locale === value)
  );
}

export function getPathLocale(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];

  return isSupportedLocale(segment) ? segment : null;
}

function getAcceptedLocale(acceptLanguage: string | null | undefined) {
  if (!acceptLanguage) {
    return null;
  }

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [languageRange = "", ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().toLowerCase().startsWith("q=")
      );
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;
      const quality =
        Number.isFinite(parsedQuality) && parsedQuality >= 0
          ? Math.min(parsedQuality, 1)
          : 0;

      return { languageRange: languageRange.toLowerCase(), quality, index };
    })
    .filter(({ quality }) => quality > 0)
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index
    );

  for (const { languageRange } of preferences) {
    const baseLanguage = languageRange.split("-")[0];

    if (isSupportedLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return null;
}

type LocalePreferences = {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
};

export function selectLocale({
  cookieLocale,
  acceptLanguage,
}: LocalePreferences): Locale {
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return getAcceptedLocale(acceptLanguage) ?? defaultLocale;
}
