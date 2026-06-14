export type ListingType = "Sale" | "Rent";

export type PropertyType = "Apartment" | "House";

export type ListingStatus =
  | "Draft"
  | "Active"
  | "Reserved"
  | "Sold"
  | "Rented"
  | "Archived";

export type Listing = {
  id: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: ListingStatus;
  price: number;
  currency: string;
  areaSquareMeters: number;
  pricePerSquareMeter: number;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  languageCode: string;
  title: string;
  description: string | null;
  addressLine: string | null;
  city: string | null;
  neighborhood: string | null;
};
