import { defaultLocale, type Locale } from "@/i18n/locales";

type OptionalNumber = number | null | undefined;
type OptionalString = string | null | undefined;

// UI components should pass dictionary.listings.notSpecified for localized fallbacks.
const intlLocales: Record<Locale, string> = {
  en: "en-US",
  mk: "mk-MK",
};

function getIntlLocale(locale: Locale) {
  return intlLocales[locale];
}

export function formatOptionalText(
  value: OptionalString,
  fallback = "Not specified"
) {
  return value?.trim() || fallback;
}

export function formatOptionalNumber(
  value: OptionalNumber,
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function formatPrice(
  price: OptionalNumber,
  currency = "EUR",
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (price === null || price === undefined) {
    return fallback;
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatAreaSquareMeters(
  areaSquareMeters: OptionalNumber,
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (areaSquareMeters === null || areaSquareMeters === undefined) {
    return fallback;
  }

  return `${formatOptionalNumber(areaSquareMeters, locale, fallback)} m²`;
}

export function formatPricePerSquareMeter(
  pricePerSquareMeter: OptionalNumber,
  currency = "EUR",
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (pricePerSquareMeter === null || pricePerSquareMeter === undefined) {
    return fallback;
  }

  return `${formatPrice(pricePerSquareMeter, currency, locale, fallback)} / m²`;
}

export function formatRooms(
  rooms: OptionalNumber,
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (rooms === null || rooms === undefined) {
    return fallback;
  }

  return formatOptionalNumber(rooms, locale, fallback);
}

export function formatBathrooms(
  bathrooms: OptionalNumber,
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (bathrooms === null || bathrooms === undefined) {
    return fallback;
  }

  return formatOptionalNumber(bathrooms, locale, fallback);
}

export function formatFloor(
  floor: OptionalNumber,
  totalFloors?: OptionalNumber,
  locale: Locale = defaultLocale,
  fallback = "Not specified"
) {
  if (floor === null || floor === undefined) {
    return fallback;
  }

  const formattedFloor = formatOptionalNumber(floor, locale, fallback);

  if (totalFloors === null || totalFloors === undefined) {
    return formattedFloor;
  }

  return `${formattedFloor}/${formatOptionalNumber(totalFloors, locale, fallback)}`;
}
