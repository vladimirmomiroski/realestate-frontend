import Link from "next/link";

import { routes } from "@/config/routes";
import type { Dictionary, Locale } from "@/i18n";

import {
  publicListingsPageUrl,
  type PublicListingsSearchState,
} from "../search/public-listings-search";

type PublicListingsEmptyStateProps = {
  totalCount: number;
  search: Extract<PublicListingsSearchState, { kind: "valid" }>;
  locale: Locale;
  labels: Pick<
    Dictionary["listings"],
    | "catalogEmptyTitle"
    | "catalogEmptyDescription"
    | "emptyTitle"
    | "emptyDescription"
    | "emptyPageTitle"
    | "emptyPageDescription"
    | "clearSearch"
    | "firstPage"
  >;
};

export function PublicListingsEmptyState({
  totalCount,
  search,
  locale,
  labels,
}: PublicListingsEmptyStateProps) {
  const { q, listingType, propertyType } = search.filters;
  const filtered = Boolean(q || listingType || propertyType);
  const emptyPage = totalCount > 0;
  const title = emptyPage
    ? labels.emptyPageTitle
    : filtered
      ? labels.emptyTitle
      : labels.catalogEmptyTitle;
  const description = emptyPage
    ? labels.emptyPageDescription
    : filtered
      ? labels.emptyDescription
      : labels.catalogEmptyDescription;
  const recovery = emptyPage
    ? {
        href: publicListingsPageUrl(locale, search, 1),
        label: labels.firstPage,
      }
    : filtered
      ? { href: routes.listings(locale), label: labels.clearSearch }
      : null;

  return (
    <section
      aria-labelledby="public-listings-empty-heading"
      className="border-border bg-surface max-w-3xl rounded-lg border p-5 sm:p-6"
    >
      <h2 id="public-listings-empty-heading" className="text-xl font-semibold">
        {title}
      </h2>
      <p className="text-on-surface-muted mt-3 max-w-2xl leading-7">
        {description}
      </p>
      {recovery && (
        <Link
          href={recovery.href}
          className="text-primary focus-visible:outline-focus-ring mt-3 inline-flex min-h-11 items-center rounded-md font-medium underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2"
        >
          {recovery.label}
        </Link>
      )}
    </section>
  );
}
