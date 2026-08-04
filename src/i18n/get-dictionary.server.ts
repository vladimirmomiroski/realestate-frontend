import "server-only";

import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/types";

const dictionaryLoaders = {
  mk: () => import("./dictionaries/mk").then((module) => module.mk),
  en: () => import("./dictionaries/en").then((module) => module.en),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaryLoaders[locale]();
}
