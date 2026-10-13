import Form from "next/form";
import Link from "next/link";

import { routes } from "@/config/routes";
import type { Dictionary, Locale } from "@/i18n";
import { Button } from "@/components/ui/button";

import type { PublicListingsSearchState } from "../search/public-listings-search";

type SearchLabels = Pick<
  Dictionary["listings"],
  | "search"
  | "searchLabel"
  | "searchHint"
  | "searchTooShort"
  | "searchTooLong"
  | "searchRepeated"
  | "searchInvalidSummary"
  | "clearSearch"
>;

type PublicListingsSearchFormProps = {
  locale: Locale;
  search: PublicListingsSearchState;
  labels: SearchLabels;
};

const inputId = "public-listings-keyword";
const hintId = "public-listings-keyword-hint";
const errorId = "public-listings-keyword-error";

export function PublicListingsSearchForm({
  locale,
  search,
  labels,
}: PublicListingsSearchFormProps) {
  const invalid = search.kind === "invalid-q";
  const value = invalid
    ? typeof search.invalidQ.value === "string"
      ? search.invalidQ.value
      : ""
    : (search.filters.q ?? "");
  const error = invalid
    ? {
        "too-short": labels.searchTooShort,
        "too-long": labels.searchTooLong,
        repeated: labels.searchRepeated,
      }[search.invalidQ.reason]
    : undefined;

  return (
    <div className="mt-10 max-w-4xl">
      <Form
        action={routes.listings(locale)}
        role="search"
        aria-label={labels.search}
        className="border-border bg-surface rounded-lg border p-5 sm:p-6"
      >
        <label htmlFor={inputId} className="block font-semibold">
          {labels.searchLabel}
        </label>
        <p id={hintId} className="text-on-surface-muted mt-1 text-sm">
          {labels.searchHint}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            key={value}
            id={inputId}
            name="q"
            type="search"
            defaultValue={value}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
            className={`bg-surface text-foreground focus-visible:outline-focus-ring min-h-11 min-w-0 flex-1 rounded-md border px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2 ${invalid ? "border-destructive" : "border-border"}`}
          />
          <Button type="submit">{labels.search}</Button>
        </div>
        {error && (
          <p id={errorId} className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}
      </Form>
      {invalid && (
        <p role="alert" className="text-destructive mt-3 font-medium">
          {labels.searchInvalidSummary}
        </p>
      )}
      {(value || invalid) && (
        <Link
          href={routes.listings(locale)}
          className="text-primary focus-visible:outline-focus-ring mt-3 inline-flex min-h-11 items-center rounded-md font-medium underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2"
        >
          {labels.clearSearch}
        </Link>
      )}
    </div>
  );
}
