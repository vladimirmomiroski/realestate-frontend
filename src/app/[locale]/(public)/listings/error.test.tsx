import { Component, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { ClientDictionaryProvider } from "@/i18n/client-context";
import { getClientDictionary } from "@/i18n/client-dictionary";
import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import ListingsError from "./error";

afterEach(() => vi.unstubAllEnvs());

class TestBoundary extends Component<
  { children: ReactNode; retry: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <ListingsError error={this.state.error} retry={this.props.retry} />
    ) : (
      this.props.children
    );
  }
}
function BrokenContent(): ReactNode {
  throw new Error("Sensitive internal stack https://private.example");
}

for (const { locale, dictionary } of [
  { locale: "en", dictionary: en },
  { locale: "mk", dictionary: mk },
] as const) {
  it(`${locale} catches unexpected rendering errors using stable retry without showing internal details`, async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ClientDictionaryProvider
        locale={locale}
        dictionary={getClientDictionary(dictionary)}
      >
        <TestBoundary retry={retry}>
          <BrokenContent />
        </TestBoundary>
      </ClientDictionaryProvider>
    );
    expect(screen.getByRole("alert")).toHaveAccessibleName(
      dictionary.errors.genericTitle
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(dictionary.errors.genericDescription)
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/Sensitive|private.example/);
    expect(
      container.querySelector("html, body, header, footer, main")
    ).toBeNull();
    expect(
      screen.queryByText(dictionary.errors.requestIdLabel)
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: dictionary.errors.retry })
    );
    expect(retry).toHaveBeenCalledExactlyOnceWith();
  });
}

it("logs the client-visible error in development without displaying its digest as a backend ID", () => {
  vi.stubEnv("NODE_ENV", "development");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = Object.assign(new Error("Diagnostic error"), {
    digest: "framework-digest",
  });
  render(
    <ClientDictionaryProvider locale="en" dictionary={getClientDictionary(en)}>
      <ListingsError error={error} retry={vi.fn()} />
    </ClientDictionaryProvider>
  );
  expect(log).toHaveBeenCalledWith(error);
  expect(
    screen.queryByText(/Diagnostic error|framework-digest/)
  ).not.toBeInTheDocument();
});
