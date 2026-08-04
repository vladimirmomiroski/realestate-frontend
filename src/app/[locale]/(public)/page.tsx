import { notFound } from "next/navigation";

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
    <main className="bg-background text-foreground min-h-screen px-6 py-16">
      <section className="mx-auto max-w-3xl">
        <p className="text-muted-foreground text-sm font-medium">
          {dictionary.home.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {dictionary.home.title}
        </h1>
        <p className="text-muted-foreground mt-6 text-lg leading-8">
          {dictionary.home.description}
        </p>
      </section>
    </main>
  );
}
