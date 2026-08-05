import { notFound } from "next/navigation";

import { PublicFooter } from "@/components/shell/public-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { SkipLink } from "@/components/shell/skip-link";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary.server";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col overflow-x-clip">
      <SkipLink label={dictionary.accessibility.skipToContent} />
      <PublicHeader dictionary={dictionary} locale={locale} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <PublicFooter dictionary={dictionary} />
    </div>
  );
}
