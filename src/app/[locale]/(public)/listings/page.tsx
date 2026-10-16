import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RefreshErrorState } from "@/components/feedback/refresh-error-state";
import { routes } from "@/config/routes";
import { getPublicListings } from "@/features/listings/api/get-public-listings.server";
import { PublicListingsEmptyState } from "@/features/listings/components/public-listings-empty-state";
import { PublicListingsPagination } from "@/features/listings/components/public-listings-pagination";
import { PublicListingsResults } from "@/features/listings/components/public-listings-results";
import { PublicListingsSearchForm } from "@/features/listings/components/public-listings-search-form";
import { publicListingsError } from "@/features/listings/model/public-listings-error";
import {
  parsePublicListingsSearchParams,
  toPublicListingsQuery,
} from "@/features/listings/search/public-listings-search";
import { isSupportedLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

export const dynamic = "force-dynamic";

type ListingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: ListingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const [dictionary, query] = await Promise.all([
    getDictionary(locale),
    searchParams,
  ]);

  return {
    title: dictionary.metadata.listings.title,
    description: dictionary.metadata.listings.description,
    alternates: {
      canonical: routes.listings(locale),
      languages: Object.fromEntries(
        locales.map((supportedLocale) => [
          supportedLocale,
          routes.listings(supportedLocale),
        ])
      ),
    },
    // URL presence governs indexing, including ignored and default-valued keys.
    robots: { index: Object.keys(query).length === 0, follow: true },
  };
}

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
  let listings = null;
  let failure = null;
  if (search.kind === "valid") {
    try {
      listings = await getPublicListings({
        locale,
        query: toPublicListingsQuery(search),
      });
    } catch (error) {
      failure = publicListingsError(error, dictionary.listings.failure);
      if (!failure) throw error;
    }
  }

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
      {failure && (
        <RefreshErrorState
          title={dictionary.listings.failure.title}
          description={failure.description}
          requestId={failure.requestId}
          labels={dictionary.errors}
        />
      )}
      {listings && (
        <>
          <PublicListingsResults
            items={listings.items}
            totalCount={listings.totalCount}
            locale={locale}
            dictionary={dictionary}
          />
          {search.kind === "valid" &&
            (listings.items.length === 0 ? (
              <PublicListingsEmptyState
                totalCount={listings.totalCount}
                search={search}
                locale={locale}
                labels={dictionary.listings}
              />
            ) : (
              <PublicListingsPagination
                pagination={listings}
                search={search}
                locale={locale}
                labels={dictionary.listings}
              />
            ))}
        </>
      )}
    </div>
  );
}
