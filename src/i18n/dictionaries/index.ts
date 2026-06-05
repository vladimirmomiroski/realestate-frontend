import { defaultLocale, type Locale } from "../locales";
import { en } from "./en";
import { mk } from "./mk";
import type { Dictionary } from "./types";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  mk,
};

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}
