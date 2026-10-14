import type { Dictionary, Locale } from "@/i18n";
import { resolveMediaUrl } from "@/lib/media/media-url";

import type { PublicListingCard } from "../model/public-listing-card";
import { PublicListingMedia } from "./public-listing-media";
import {
  formatAreaSquareMeters,
  formatPrice,
  formatPricePerSquareMeter,
  formatRooms,
} from "../utils/listing-formatters";
import {
  getListingTypeLabel,
  getPropertyTypeLabel,
} from "../utils/listing-labels";

type PublicListingCardViewProps = {
  listing: PublicListingCard;
  locale: Locale;
  dictionary: Dictionary;
};

export function PublicListingCardView({
  listing,
  locale,
  dictionary,
}: PublicListingCardViewProps) {
  const titleId = `listing-title-${listing.id}`;
  const mediaUrl = resolveMediaUrl(listing.primaryImageUrl);
  const location = [
    ...new Set(
      [listing.neighborhood, listing.municipality, listing.city].filter(Boolean)
    ),
  ].join(", ");

  return (
    <article
      aria-labelledby={titleId}
      className="border-border bg-surface rounded-lg border p-5 shadow-sm sm:grid sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6 sm:p-6"
    >
      <PublicListingMedia
        src={mediaUrl}
        unavailableLabel={dictionary.listings.imageUnavailable}
      />
      <div className="mt-5 min-w-0 sm:mt-0">
        <p className="text-primary text-sm font-medium">
          {getListingTypeLabel(listing.listingType, dictionary)} ·{" "}
          {getPropertyTypeLabel(listing.propertyType, dictionary)}
        </p>
        <div lang={listing.languageCode} className="mt-3">
          <h2 id={titleId} className="text-xl font-semibold text-balance">
            {listing.title}
          </h2>
          <p className="text-on-surface-muted mt-2 leading-6">{location}</p>
        </div>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <dt className="text-on-surface-muted text-sm">
              {dictionary.listings.price}
            </dt>
            <dd className="mt-1 font-semibold">
              {formatPrice(listing.price, listing.currency, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-on-surface-muted text-sm">
              {dictionary.listings.area}
            </dt>
            <dd className="mt-1 font-medium">
              {formatAreaSquareMeters(listing.areaSquareMeters, locale)}
            </dd>
          </div>
          {listing.rooms !== undefined && (
            <div>
              <dt className="text-on-surface-muted text-sm">
                {dictionary.listings.rooms}
              </dt>
              <dd className="mt-1 font-medium">
                {formatRooms(listing.rooms, locale)}
              </dd>
            </div>
          )}
          {listing.pricePerSquareMeter !== undefined && (
            <div>
              <dt className="text-on-surface-muted text-sm">
                {dictionary.listings.pricePerSquareMeter}
              </dt>
              <dd className="mt-1 font-medium">
                {formatPricePerSquareMeter(
                  listing.pricePerSquareMeter,
                  listing.currency,
                  locale
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
