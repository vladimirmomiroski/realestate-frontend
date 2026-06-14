export type Dictionary = {
  common: {
    appName: string;
  };

  navigation: {
    listings: string;
    login: string;
    register: string;
    dashboard: string;
    saved: string;
    profile: string;
    admin: string;
    users: string;
  };

  home: {
    eyebrow: string;
    title: string;
    description: string;
  };

  theme: {
    toggle: string;
    light: string;
    dark: string;
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
