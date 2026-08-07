export type PublicListingType = "Sale" | "Rent";
export type PublicPropertyType = "Apartment" | "House";

export type PublicListingCard = {
  id: string;
  listingType: PublicListingType;
  propertyType: PublicPropertyType;
  price: number;
  currency: string;
  areaSquareMeters: number;
  rooms?: number;
  pricePerSquareMeter?: number;
  title?: string;
  city?: string;
  municipality?: string;
  neighborhood?: string;
  languageCode?: string;
  primaryImageUrl?: string;
};
