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
    requestIdCopied: "Support ID copied.",
    requestIdCopyFailed:
      "Unable to copy. Select and copy the support ID above.",
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
    failure: {
      title: "Unable to load properties",
      validation:
        "The search could not be processed. Please try again or change your search.",
      server: "The server encountered a problem. Please try again.",
      http: "Properties could not be loaded. Please try again.",
      malformed:
        "The returned listing data could not be displayed. Please try again.",
      network: "The connection could not be completed. Please try again.",
    },
    title: "Listings",
    subtitle: "Browse homes for sale and rent across North Macedonia.",
    filters: "Filters",
    results: "Results",
    emptyTitle: "No matching properties",
    emptyDescription:
      "Try another keyword or change the listing or property type.",
    catalogEmptyTitle: "No properties available",
    catalogEmptyDescription:
      "There are currently no properties in this catalog.",
    emptyPageTitle: "No results on this page",
    emptyPageDescription:
      "This page has no listings. Return to the first page to view the matching properties.",
    firstPage: "Return to the first page",
    listingType: "Listing type",
    propertyType: "Property type",
    allListingTypes: "All listing types",
    allPropertyTypes: "All property types",
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
    searchLabel: "Keyword or location",
    searchHint:
      "Enter 2–100 characters, or leave blank to browse all listings.",
    searchTooShort: "Enter at least 2 characters.",
    searchTooLong: "Enter no more than 100 characters.",
    searchRepeated: "Use one search keyword.",
    searchInvalidSummary: "Check the search keyword and try again.",
    clearSearch: "Clear search",
    reset: "Reset",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: "Page",
    pagination: "Result pages",
    navigationPending: "Loading…",
    pageOf: "Page {page} of {totalPages}",
    totalResults: "Total results",
    resultCount: {
      zero: "0 properties found",
      one: "1 property found",
      many: "{count} properties found",
    },
    notSpecified: "Not specified",
    imageUnavailable: "Image unavailable",
    listingTypes: {
      Sale: "Sale",
      Rent: "Rent",
    },
    propertyTypes: {
      Apartment: "Apartment",
      House: "House",
      Commercial: "Commercial",
      Land: "Land",
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
