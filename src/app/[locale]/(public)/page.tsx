import Link from "next/link";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <section className="max-w-3xl" aria-labelledby="home-heading">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">
          {dictionary.home.eyebrow}
        </p>
        <h1
          id="home-heading"
          className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          {dictionary.home.title}
        </h1>
        <p className="text-on-surface-muted mt-6 max-w-2xl text-lg leading-8">
          {dictionary.home.description}
        </p>
        <Link
          href={routes.listings(locale)}
          className="bg-primary text-on-primary hover:bg-primary/90 mt-8 inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 font-semibold shadow-sm"
        >
          {dictionary.home.browseListings}
        </Link>
      </section>

      <section className="mt-16" aria-labelledby="home-features-heading">
        <h2 id="home-features-heading" className="text-xl font-semibold">
          {dictionary.home.featuresLabel}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [
              dictionary.home.discoveryTitle,
              dictionary.home.discoveryDescription,
            ],
            [dictionary.home.filtersTitle, dictionary.home.filtersDescription],
            [dictionary.home.priceTitle, dictionary.home.priceDescription],
          ].map(([title, description]) => (
            <article
              key={title}
              className="border-border bg-surface rounded-lg border p-6 shadow-sm"
            >
              <h3 className="font-semibold">{title}</h3>
              <p className="text-on-surface-muted mt-3 leading-7">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
