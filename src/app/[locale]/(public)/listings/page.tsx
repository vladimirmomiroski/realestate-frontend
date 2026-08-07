import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

type ListingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ListingsPage({ params }: ListingsPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

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
    </div>
  );
}
