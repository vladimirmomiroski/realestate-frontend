import type { Dictionary } from "@/i18n";

type PublicFooterProps = {
  dictionary: Dictionary;
};

export function PublicFooter({ dictionary }: PublicFooterProps) {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="text-on-surface-muted mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm sm:px-6 lg:px-8">
        <p>{dictionary.common.appName}</p>
        <p>{dictionary.common.footerText}</p>
      </div>
    </footer>
  );
}
