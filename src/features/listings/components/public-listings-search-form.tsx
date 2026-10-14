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
  | "reset"
  | "listingType"
  | "propertyType"
  | "allListingTypes"
  | "allPropertyTypes"
  | "listingTypes"
  | "propertyTypes"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label htmlFor={inputId} className="block font-semibold">
              {labels.searchLabel}
            </label>
            <p id={hintId} className="text-on-surface-muted mt-1 text-sm">
              {labels.searchHint}
            </p>
            <input
              key={value}
              id={inputId}
              name="q"
              type="search"
              defaultValue={value}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
              className={`bg-surface text-foreground focus-visible:outline-focus-ring mt-4 min-h-11 w-full min-w-0 rounded-md border px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2 ${invalid ? "border-destructive" : "border-border"}`}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="public-listings-listing-type"
              className="block font-semibold"
            >
              {labels.listingType}
            </label>
            <select
              key={search.filters.listingType ?? ""}
              id="public-listings-listing-type"
              name="listingType"
              defaultValue={search.filters.listingType ?? ""}
              className="border-border bg-surface text-foreground focus-visible:outline-focus-ring mt-2 min-h-11 w-full min-w-0 rounded-md border px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2"
            >
              <option value="">{labels.allListingTypes}</option>
              <option value="Sale">{labels.listingTypes.Sale}</option>
              <option value="Rent">{labels.listingTypes.Rent}</option>
            </select>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="public-listings-property-type"
              className="block font-semibold"
            >
              {labels.propertyType}
            </label>
            <select
              key={search.filters.propertyType ?? ""}
              id="public-listings-property-type"
              name="propertyType"
              defaultValue={search.filters.propertyType ?? ""}
              className="border-border bg-surface text-foreground focus-visible:outline-focus-ring mt-2 min-h-11 w-full min-w-0 rounded-md border px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2"
            >
              <option value="">{labels.allPropertyTypes}</option>
              <option value="Apartment">
                {labels.propertyTypes.Apartment}
              </option>
              <option value="House">{labels.propertyTypes.House}</option>
            </select>
          </div>
          <Button type="submit" className="sm:col-span-2 lg:col-span-1">
            {labels.search}
          </Button>
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
      {(value ||
        invalid ||
        search.filters.listingType ||
        search.filters.propertyType) && (
        <Link
          href={routes.listings(locale)}
          className="text-primary focus-visible:outline-focus-ring mt-3 inline-flex min-h-11 items-center rounded-md font-medium underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2"
        >
          {search.filters.listingType || search.filters.propertyType
            ? labels.reset
            : labels.clearSearch}
        </Link>
      )}
    </div>
  );
}
