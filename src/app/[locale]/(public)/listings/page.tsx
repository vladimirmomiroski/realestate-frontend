import { notFound } from "next/navigation";

import { getPublicListings } from "@/features/listings/api/get-public-listings.server";
import { PublicListingCardView } from "@/features/listings/components/public-listing-card";
import { PublicListingsSearchForm } from "@/features/listings/components/public-listings-search-form";
import {
  parsePublicListingsSearchParams,
  toPublicListingsQuery,
} from "@/features/listings/search/public-listings-search";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

export const dynamic = "force-dynamic";

type ListingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ListingsPage({
  params,
  searchParams,
}: ListingsPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const search = parsePublicListingsSearchParams(await searchParams);
  const dictionary = await getDictionary(locale);
  const listings =
    search.kind === "valid"
      ? await getPublicListings({
          locale,
          query: toPublicListingsQuery(search),
        })
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <section className="max-w-3xl" aria-labelledby="listings-heading">
        <h1
          id="listings-heading"
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          {dictionary.listings.title}
        </h1>
        <p className="text-on-surface-muted mt-6 max-w-2xl text-lg leading-8">
          {dictionary.listings.subtitle}
        </p>
      </section>
      <PublicListingsSearchForm
        locale={locale}
        search={search}
        labels={dictionary.listings}
      />
      {listings && (
        <section
          aria-label={dictionary.listings.results}
          className="mt-10 max-w-4xl"
        >
          <div className="space-y-5">
            {listings.items.map((listing) => (
              <PublicListingCardView
                key={listing.id}
                listing={listing}
                locale={locale}
                dictionary={dictionary}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
