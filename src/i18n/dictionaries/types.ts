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
    listings: {
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
    requestIdCopied: string;
    requestIdCopyFailed: string;
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
    failure: {
      title: string;
      validation: string;
      server: string;
      http: string;
      malformed: string;
      network: string;
    };
    title: string;
    subtitle: string;
    filters: string;
    results: string;
    emptyTitle: string;
    emptyDescription: string;
    catalogEmptyTitle: string;
    catalogEmptyDescription: string;
    emptyPageTitle: string;
    emptyPageDescription: string;
    firstPage: string;
    listingType: string;
    propertyType: string;
    allListingTypes: string;
    allPropertyTypes: string;
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
    searchLabel: string;
    searchHint: string;
    searchTooShort: string;
    searchTooLong: string;
    searchRepeated: string;
    searchInvalidSummary: string;
    clearSearch: string;
    reset: string;
    previousPage: string;
    nextPage: string;
    page: string;
    pagination: string;
    navigationPending: string;
    pageOf: string;
    totalResults: string;
    resultCount: {
      zero: string;
      one: string;
      many: string;
    };
    notSpecified: string;
    imageUnavailable: string;
    listingTypes: {
      Sale: string;
      Rent: string;
    };
    propertyTypes: {
      Apartment: string;
      House: string;
      Commercial: string;
      Land: string;
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
