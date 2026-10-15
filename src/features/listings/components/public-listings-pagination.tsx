import Link from "next/link";

import type { Dictionary, Locale } from "@/i18n";
import type { Page } from "@/lib/api/page";

import type { PublicListingsSearchState } from "../search/public-listings-search";
import { publicListingsPageUrl } from "../search/public-listings-search";
import { formatOptionalNumber } from "../utils/listing-formatters";

type Pagination = Pick<
  Page<unknown>,
  "page" | "totalPages" | "hasNextPage" | "hasPreviousPage"
>;

type PublicListingsPaginationProps = {
  pagination: Pagination;
  search: Extract<PublicListingsSearchState, { kind: "valid" }>;
  locale: Locale;
  labels: Pick<
    Dictionary["listings"],
    "pagination" | "previousPage" | "nextPage" | "pageOf"
  >;
};

const linkClassName =
  "text-primary focus-visible:outline-focus-ring inline-flex min-h-11 items-center rounded-md px-3 font-medium underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2";

export function PublicListingsPagination({
  pagination,
  search,
  locale,
  labels,
}: PublicListingsPaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = pagination;

  if (
    totalPages === 0 ||
    page > totalPages ||
    (!hasPreviousPage && !hasNextPage)
  ) {
    return null;
  }

  const currentPage = labels.pageOf
    .replace("{page}", formatOptionalNumber(page, locale))
    .replace("{totalPages}", formatOptionalNumber(totalPages, locale));

  return (
    <nav
      aria-label={labels.pagination}
      className="border-border mt-10 border-t pt-6"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        {hasPreviousPage && (
          <Link
            href={publicListingsPageUrl(locale, search, page - 1)}
            className={linkClassName}
          >
            {labels.previousPage}
          </Link>
        )}
        <p
          aria-current="page"
          className="inline-flex min-h-11 items-center font-medium"
        >
          {currentPage}
        </p>
        {hasNextPage && (
          <Link
            href={publicListingsPageUrl(locale, search, page + 1)}
            className={linkClassName}
          >
            {labels.nextPage}
          </Link>
        )}
      </div>
    </nav>
  );
}
