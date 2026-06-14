import type { Dictionary } from "./types";

export const en = {
  common: {
    appName: "Real Estate Frontend",
  },

  navigation: {
    listings: "Listings",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    saved: "Saved",
    profile: "Profile",
    admin: "Admin",
    users: "Users",
  },

  home: {
    eyebrow: "Real estate intelligence platform",
    title: "Find apartments and understand their real value.",
    description:
      "A smarter apartment search experience focused on comparisons, price insights, and better buying decisions.",
  },

  theme: {
    toggle: "Toggle theme",
    light: "Light mode",
    dark: "Dark mode",
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
    pricePerSquareMeter: "Price per square meter",
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
