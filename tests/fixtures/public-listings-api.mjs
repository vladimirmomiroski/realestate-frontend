import { createServer } from "node:http";

const listings = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    listingType: "Sale",
    propertyType: "Apartment",
    status: "Active",
    price: 145000,
    currency: "EUR",
    areaSquareMeters: 82.5,
    rooms: 3,
    pricePerSquareMeter: 1757.58,
    title: "Стан во Центар",
    languageCode: "mk",
    city: "Скопје",
    municipality: "Центар",
    neighborhood: "Дебар Маало",
    addressLine: "Улица 1",
    description: "Стан во центарот на градот.",
    latitude: 41.9981,
    longitude: 21.4254,
    locationPrecision: "Street",
    primaryImageUrl: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    listingType: "Rent",
    propertyType: "House",
    status: "Active",
    price: 1200,
    currency: "EUR",
    areaSquareMeters: 160,
    rooms: 4,
    title: "Family house",
    languageCode: "en",
    city: "Skopje",
    municipality: "Karpoš",
    neighborhood: null,
    addressLine: "Street 2",
    description: "House near the park.",
    latitude: 42.004,
    longitude: 21.391,
    locationPrecision: "Neighborhood",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    listingType: "Rent",
    propertyType: "Commercial",
    status: "Active",
    price: 950,
    currency: "EUR",
    areaSquareMeters: 75,
    rooms: null,
    title: "Office by the square",
    languageCode: "en",
    city: "Bitola",
    municipality: "Bitola",
    addressLine: "Square 3",
    description: "Office space near the square.",
    latitude: 41.031,
    longitude: 21.334,
    locationPrecision: "Municipality",
    commercialDetails: { commercialType: "Office" },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    listingType: "Sale",
    propertyType: "Land",
    status: "Active",
    price: 68000,
    currency: "EUR",
    areaSquareMeters: 540,
    title: "Градежно земјиште",
    languageCode: "mk",
    city: "Охрид",
    municipality: "Охрид",
    addressLine: "Улица 4",
    description: "Парцела во градот.",
    latitude: 41.123,
    longitude: 20.802,
    locationPrecision: "City",
    landDetails: { landType: "BuildingPlot" },
  },
];

const page = {
  items: listings,
  page: 1,
  pageSize: 20,
  totalCount: listings.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost:5231");
  const { searchParams } = url;
  const allowedKeys = new Set([
    "lang",
    "pageSize",
    "q",
    "listingType",
    "propertyType",
  ]);
  const validKeys = [...searchParams.keys()].every(
    (key) => allowedKeys.has(key) && searchParams.getAll(key).length === 1
  );
  const q = searchParams.get("q");
  const listingType = searchParams.get("listingType");
  const propertyType = searchParams.get("propertyType");

  if (
    request.method !== "GET" ||
    url.pathname !== "/api/listings" ||
    !validKeys ||
    !["mk", "en"].includes(searchParams.get("lang")) ||
    searchParams.get("pageSize") !== "20" ||
    ![null, "", "Family"].includes(q) ||
    ![null, "", "Sale", "Rent"].includes(listingType) ||
    ![null, "", "Apartment", "House"].includes(propertyType)
  ) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  const items = listings.filter(
    (listing) =>
      (q !== "Family" || listing.title === "Family house") &&
      (!listingType || listing.listingType === listingType) &&
      (!propertyType || listing.propertyType === propertyType)
  );
  response.end(
    JSON.stringify({
      ...page,
      items,
      totalCount: items.length,
      totalPages: items.length ? 1 : 0,
    })
  );
}).listen(5231, "localhost");
