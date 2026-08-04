"use client";

import Link from "next/link";

import { routes } from "@/config/routes";
import { useClientDictionary, useCurrentLocale } from "@/i18n/client-context";

export default function LocaleNotFound() {
  const dictionary = useClientDictionary();
  const locale = useCurrentLocale();

  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="mt-3 text-3xl font-semibold">
        {dictionary.errors.notFoundTitle}
      </h1>
      <p className="text-on-surface-muted mt-4 leading-7">
        {dictionary.errors.notFoundDescription}
      </p>
      <Link
        href={routes.home(locale)}
        className="bg-primary text-on-primary mt-7 inline-flex min-h-11 items-center rounded-md px-5 py-2.5 font-semibold"
      >
        {dictionary.errors.backHome}
      </Link>
    </section>
  );
}
