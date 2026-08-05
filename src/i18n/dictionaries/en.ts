import type { Dictionary } from "./types";

export const en = {
  common: {
    appName: "Real Estate Frontend",
    footerText: "Clear property discovery for North Macedonia.",
  },

  metadata: {
    home: {
      title: "Property in North Macedonia",
      description:
        "Discover homes for sale and rent across North Macedonia with clear property information.",
    },
  },

  navigation: {
    home: "Home",
    listings: "Listings",
  },

  home: {
    eyebrow: "Property discovery in North Macedonia",
    title: "Find a home that fits your plans.",
    description:
      "Explore homes for sale and rent with clear details, structured filters, and price per square metre.",
    featuresLabel: "What you can explore",
    discoveryTitle: "Property discovery",
    discoveryDescription:
      "Browse a focused catalogue of homes for sale and rent.",
    filtersTitle: "Structured filters",
    filtersDescription:
      "Narrow future listing results by practical property criteria.",
    priceTitle: "Comparable pricing",
    priceDescription:
      "Review the listed price per square metre alongside property details.",
    browseListings: "Browse listings",
  },

  theme: {
    label: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
  },

  locale: {
    label: "Language",
    mk: "Macedonian",
    en: "English",
  },

  errors: {
    genericTitle: "Something went wrong",
    genericDescription: "Please try again.",
    retry: "Try again",
    requestIdLabel: "Support ID",
    copyRequestId: "Copy support ID",
    notFoundTitle: "Page not found",
    notFoundDescription: "The page you requested could not be found.",
    backHome: "Back to home",
  },

  accessibility: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    primaryNavigation: "Primary navigation",
  },

  listings: {
    title: "Listings",
    subtitle: "Browse homes for sale and rent across North Macedonia.",
    filters: "Filters",
    results: "Results",
    emptyTitle: "No listings found",
    emptyDescription: "Try changing your filters or search area.",
    listingType: "Listing type",
    propertyType: "Property type",
    price: "Price",
    minPrice: "Minimum price",
    maxPrice: "Maximum price",
    area: "Area",
    pricePerSquareMeter: "Price per square metre",
    rooms: "Rooms",
    bathrooms: "Bathrooms",
    floor: "Floor",
    city: "City",
    neighborhood: "Neighborhood",
    status: "Status",
    search: "Search",
    reset: "Reset",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: "Page",
    totalResults: "Total results",
    notSpecified: "Not specified",
    listingTypes: {
      Sale: "Sale",
      Rent: "Rent",
    },
    propertyTypes: {
      Apartment: "Apartment",
      House: "House",
    },
    statuses: {
      Draft: "Draft",
      Active: "Active",
      Reserved: "Reserved",
      Sold: "Sold",
      Rented: "Rented",
      Archived: "Archived",
    },
  },
} satisfies Dictionary;
