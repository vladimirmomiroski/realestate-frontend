import { Suspense } from "react";
import Link from "next/link";

import { getPublicNavigation } from "@/config/navigation";
import { routes } from "@/config/routes";
import type { Dictionary, Locale } from "@/i18n";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeControl } from "./theme-control";

type PublicHeaderProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function PublicHeader({ dictionary, locale }: PublicHeaderProps) {
  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={routes.home(locale)}
          className="mr-auto min-h-11 content-center rounded-md font-semibold"
        >
          {dictionary.common.appName}
        </Link>

        <nav aria-label={dictionary.accessibility.primaryNavigation}>
          <ul className="flex flex-wrap items-center gap-1">
            {getPublicNavigation(locale).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-surface-muted inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium"
                >
                  {dictionary.navigation[item.labelKey]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="bg-surface-muted h-12 w-44 rounded-lg"
              />
            }
          >
            <LocaleSwitcher />
          </Suspense>
          <ThemeControl />
        </div>
      </div>
    </header>
  );
}
