import type { Dictionary, Locale } from "@/i18n";

import type { PublicListingCard } from "../model/public-listing-card";
import { formatOptionalNumber } from "../utils/listing-formatters";
import { PublicListingCardView } from "./public-listing-card";

type PublicListingsResultsProps = {
  items: PublicListingCard[];
  totalCount: number;
  locale: Locale;
  dictionary: Dictionary;
};

export function PublicListingsResults({
  items,
  totalCount,
  locale,
  dictionary,
}: PublicListingsResultsProps) {
  const countLabels = dictionary.listings.resultCount;
  const summary =
    totalCount === 0
      ? countLabels.zero
      : totalCount === 1
        ? countLabels.one
        : countLabels.many.replace(
            "{count}",
            formatOptionalNumber(totalCount, locale)
          );

  return (
    <section aria-label={dictionary.listings.results} className="mt-10">
      <p className="text-on-surface-muted font-medium">{summary}</p>
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((listing) => (
          <PublicListingCardView
            key={listing.id}
            listing={listing}
            locale={locale}
            dictionary={dictionary}
          />
        ))}
      </div>
    </section>
  );
}
