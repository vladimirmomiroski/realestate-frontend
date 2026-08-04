import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClientDictionaryProvider } from "@/i18n/client-context";
import { getClientDictionary } from "@/i18n/client-dictionary";
import { en } from "@/i18n/dictionaries/en";

import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";
import { SkipLink } from "./skip-link";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

describe("public shell", () => {
  it("provides localized landmarks and a skip link targeting main", () => {
    render(
      <ClientDictionaryProvider
        dictionary={getClientDictionary(en)}
        locale="en"
      >
        <SkipLink label={en.accessibility.skipToContent} />
        <PublicHeader dictionary={en} locale="en" />
        <main id="main-content" tabIndex={-1}>
          Content
        </main>
        <PublicFooter dictionary={en} />
      </ClientDictionaryProvider>
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Skip to content" })
    ).toHaveAttribute("href", "#main-content");
  });
});
