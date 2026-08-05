export type Dictionary = {
  common: {
    appName: string;
    footerText: string;
  };

  metadata: {
    home: {
      title: string;
      description: string;
    };
  };

  navigation: {
    home: string;
    listings: string;
  };

  home: {
    eyebrow: string;
    title: string;
    description: string;
    featuresLabel: string;
    discoveryTitle: string;
    discoveryDescription: string;
    filtersTitle: string;
    filtersDescription: string;
    priceTitle: string;
    priceDescription: string;
    browseListings: string;
  };

  theme: {
    label: string;
    system: string;
    light: string;
    dark: string;
  };

  locale: {
    label: string;
    mk: string;
    en: string;
  };

  errors: {
    genericTitle: string;
    genericDescription: string;
    retry: string;
    requestIdLabel: string;
    copyRequestId: string;
    notFoundTitle: string;
    notFoundDescription: string;
    backHome: string;
  };

  accessibility: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    primaryNavigation: string;
  };

  listings: {
    title: string;
    subtitle: string;
    filters: string;
    results: string;
    emptyTitle: string;
    emptyDescription: string;
    listingType: string;
    propertyType: string;
    price: string;
    minPrice: string;
    maxPrice: string;
    area: string;
    pricePerSquareMeter: string;
    rooms: string;
    bathrooms: string;
    floor: string;
    city: string;
    neighborhood: string;
    status: string;
    search: string;
    reset: string;
    previousPage: string;
    nextPage: string;
    page: string;
    totalResults: string;
    notSpecified: string;
    listingTypes: {
      Sale: string;
      Rent: string;
    };
    propertyTypes: {
      Apartment: string;
      House: string;
    };
    statuses: {
      Draft: string;
      Active: string;
      Reserved: string;
      Sold: string;
      Rented: string;
      Archived: string;
    };
  };
};

export type NavigationKey = keyof Dictionary["navigation"];

export type ClientDictionary = Pick<
  Dictionary,
  "common" | "navigation" | "theme" | "locale" | "errors" | "accessibility"
>;
