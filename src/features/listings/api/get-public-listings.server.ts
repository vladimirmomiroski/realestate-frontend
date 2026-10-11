import "server-only";

import type { operations } from "@/contracts/generated/openapi";
import type { Locale } from "@/i18n/config";
import { MalformedApiResponseError } from "@/lib/api/api-error";
import type { Page } from "@/lib/api/page";
import { requestApi } from "@/lib/api/transport.server";

import type { PublicListingCard } from "../model/public-listing-card";
import { parsePublicListingsResponse } from "./public-listings-contract";

type ListingsQuery = NonNullable<
  operations["Listings_GetListings"]["parameters"]["query"]
>;

export type GetPublicListingsInput = {
  locale: Locale;
  query?: Pick<ListingsQuery, "q" | "listingType" | "propertyType" | "page">;
};

export async function getPublicListings({
  locale,
  query,
}: GetPublicListingsInput): Promise<Page<PublicListingCard>> {
  const { q, listingType, propertyType, page } = query ?? {};
  const backendQuery = {
    lang: locale,
    q,
    listingType,
    propertyType,
    page,
    pageSize: 20,
  } satisfies ListingsQuery;

  const result = await requestApi({
    path: "/api/listings",
    query: backendQuery,
    omitEmptyStringQueryKeys: ["q"],
    cache: "no-store",
    parseJson: parsePublicListingsResponse,
  });

  if (result === undefined) {
    throw new MalformedApiResponseError(200, "invalid-success-body");
  }

  return result;
}
