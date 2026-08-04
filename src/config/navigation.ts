import type { Locale, NavigationKey } from "@/i18n";

import { routes } from "./routes";

type NavigationItem = {
  labelKey: NavigationKey;
  href: string;
};

export function getPublicNavigation(locale: Locale) {
  return [
    {
      labelKey: "home",
      href: routes.home(locale),
    },
    {
      labelKey: "listings",
      href: routes.listings(locale),
    },
  ] as const satisfies readonly NavigationItem[];
}
