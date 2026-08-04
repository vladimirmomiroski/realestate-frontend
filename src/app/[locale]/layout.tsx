import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { ClientDictionaryProvider } from "@/i18n/client-context";
import { getClientDictionary } from "@/i18n/client-dictionary";
import { isSupportedLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["cyrillic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["cyrillic", "latin"],
});

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

async function requireLocale(params: LocaleLayoutProps["params"]) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return locale;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return {
    metadataBase: siteConfig.url,
    title: dictionary.metadata.home.title,
    description: dictionary.metadata.home.description,
    alternates: {
      canonical: routes.home(locale),
      languages: Object.fromEntries(
        locales.map((supportedLocale) => [
          supportedLocale,
          routes.home(supportedLocale),
        ])
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);
  const clientDictionary = getClientDictionary(dictionary);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ClientDictionaryProvider dictionary={clientDictionary} locale={locale}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientDictionaryProvider>
      </body>
    </html>
  );
}
