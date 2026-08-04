"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getEquivalentLocalePath } from "@/config/routes";
import { useClientDictionary, useCurrentLocale } from "@/i18n/client-context";
import { locales } from "@/i18n/config";

export function LocaleSwitcher() {
  const dictionary = useClientDictionary();
  const currentLocale = useCurrentLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav aria-label={dictionary.locale.label}>
      <ul className="border-border bg-surface flex rounded-lg border p-1">
        {locales.map((locale) => {
          const isCurrent = locale === currentLocale;

          return (
            <li key={locale}>
              <Link
                href={getEquivalentLocalePath(
                  locale,
                  pathname,
                  searchParams.toString()
                )}
                hrefLang={locale}
                lang={locale}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ${
                  isCurrent
                    ? "bg-primary text-on-primary"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                {dictionary.locale[locale]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
