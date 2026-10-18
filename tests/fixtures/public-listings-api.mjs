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
    primaryImageUrl: "/uploads/listings/catalog-preview.png",
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
    primaryImageUrl: "https://outside.example/uploads/listings/office.png",
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
    primaryImageUrl: "/uploads/listings/missing.png",
    landDetails: { landType: "BuildingPlot" },
  },
];

const pagedListings = Array.from({ length: 21 }, (_, index) => ({
  ...listings[1],
  id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, "0")}`,
  title: `Paged family house ${String(index + 1).padStart(2, "0")}`,
}));

const stressListings = listings.map((listing, index) => ({
  ...listing,
  ...(index < 2
    ? {
        title:
          index === 0
            ? "Просторен семеен стан со тераса и поглед кон планината во мирна населба, со одлична поврзаност до центарот на градот"
            : "Spacious family home with generous living areas, a peaceful location and convenient connections to the city centre",
        neighborhood:
          index === 0
            ? "Горнодолномалорекансконаселбеноподрачје"
            : "UpperRiversideNeighbourhoodWithAnUnusuallyLongName",
        municipality:
          index === 0
            ? "Општина со многу долго име за проверка на прелевање"
            : "Municipality with a deliberately long display name",
        price: 9876543210000.99,
        areaSquareMeters: 1234567890.25,
        rooms: null,
      }
    : {}),
}));

const previewPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAIAAABAJy5dAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAUElEQVRYhe2WQQ0AQAzCpg5PqKjlk8E9mkwAIdBxKV/dzRVEQehQzVBsGXP8RDCiQzVDsWXMIRQHGjpUMxRbhhxCMNbXEZ8rzo/up1n+HGgPv5jO+dK5f1gAAAAASUVORK5CYII=",
  "base64"
);

let listingsGate = null;
let listingsRequests = 0;
let emptyCatalogLocale = null;
let listingsFailure = null;
let stressCatalogLocale = null;

function releaseListingsGate() {
  if (listingsGate) {
    clearTimeout(listingsGate.timeout);
    listingsGate.release();
    listingsGate = null;
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost:5231");
  if (url.pathname === "/__test/catalog-stress") {
    if (
      request.method === "POST" &&
      ["mk", "en"].includes(url.searchParams.get("lang"))
    ) {
      stressCatalogLocale = url.searchParams.get("lang");
      response.writeHead(204).end();
    } else if (request.method === "DELETE") {
      stressCatalogLocale = null;
      response.writeHead(204).end();
    } else response.writeHead(400).end();
    return;
  }
  if (url.pathname === "/__test/listings-failure") {
    if (
      request.method === "POST" &&
      ["mk", "en"].includes(url.searchParams.get("lang")) &&
      [
        "validation",
        "server",
        "http",
        "invalid-json",
        "malformed",
        "network",
      ].includes(url.searchParams.get("mode"))
    ) {
      listingsFailure = {
        lang: url.searchParams.get("lang"),
        mode: url.searchParams.get("mode"),
        remaining: url.searchParams.get("transient") === "1" ? 1 : null,
        requests: [],
      };
      response.writeHead(204).end();
    } else if (request.method === "DELETE") {
      listingsFailure = null;
      response.writeHead(204).end();
    } else if (request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ requests: listingsFailure?.requests ?? [] })
      );
    } else {
      response.writeHead(400).end();
    }
    return;
  }
  if (url.pathname === "/__test/catalog-empty") {
    if (
      request.method === "POST" &&
      ["mk", "en"].includes(url.searchParams.get("lang"))
    ) {
      emptyCatalogLocale = url.searchParams.get("lang");
      response.writeHead(204).end();
    } else if (request.method === "DELETE") {
      emptyCatalogLocale = null;
      response.writeHead(204).end();
    } else {
      response.writeHead(405).end();
    }
    return;
  }
  if (url.pathname === "/__test/listings-gate") {
    if (request.method === "POST") {
      releaseListingsGate();
      listingsRequests = 0;
      let release;
      const ready = new Promise((resolve) => {
        release = resolve;
      });
      listingsGate = {
        lang: url.searchParams.get("lang"),
        page: url.searchParams.get("page") ?? "1",
        pending: 0,
        ready,
        release,
        timeout: setTimeout(releaseListingsGate, 20_000),
      };
      response.writeHead(204).end();
    } else if (request.method === "DELETE") {
      releaseListingsGate();
      response.writeHead(204).end();
    } else if (request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          pending: listingsGate?.pending ?? 0,
          requests: listingsRequests,
        })
      );
    } else {
      response.writeHead(405).end();
    }
    return;
  }
  if (
    request.method === "GET" &&
    url.pathname === "/uploads/listings/catalog-preview.png"
  ) {
    response.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    });
    response.end(previewPng);
    return;
  }
  if (
    request.method === "GET" &&
    url.pathname === "/uploads/listings/missing.png"
  ) {
    response.writeHead(404).end();
    return;
  }
  const { searchParams } = url;
  const allowedKeys = new Set([
    "lang",
    "pageSize",
    "q",
    "listingType",
    "propertyType",
    "page",
  ]);
  const validKeys = [...searchParams.keys()].every(
    (key) => allowedKeys.has(key) && searchParams.getAll(key).length === 1
  );
  const q = searchParams.get("q");
  const listingType = searchParams.get("listingType");
  const propertyType = searchParams.get("propertyType");
  const requestedPage = searchParams.get("page") ?? "1";
  const page = Number(requestedPage);

  if (
    request.method !== "GET" ||
    url.pathname !== "/api/listings" ||
    !validKeys ||
    !["mk", "en"].includes(searchParams.get("lang")) ||
    searchParams.get("pageSize") !== "20" ||
    ![null, "", "Family", "Paged"].includes(q) ||
    ![null, "", "Sale", "Rent"].includes(listingType) ||
    ![null, "", "Apartment", "House"].includes(propertyType) ||
    !/^[1-9][0-9]*$/.test(requestedPage) ||
    !Number.isSafeInteger(page) ||
    page > 2147483647
  ) {
    response.writeHead(404).end();
    return;
  }

  listingsRequests += 1;
  if (
    listingsGate?.lang === searchParams.get("lang") &&
    listingsGate.page === requestedPage
  ) {
    listingsGate.pending += 1;
    await listingsGate.ready;
  }

  if (listingsFailure?.lang === searchParams.get("lang")) {
    listingsFailure.requests.push(Object.fromEntries(searchParams));
    if (listingsFailure.remaining === null || listingsFailure.remaining > 0) {
      if (listingsFailure.remaining !== null) listingsFailure.remaining -= 1;
      const { mode } = listingsFailure;
      if (mode === "network") {
        response.destroy();
      } else if (mode === "http") {
        response.writeHead(502, {
          "Content-Type": "text/plain",
          "Cache-Control": "no-store",
        });
        response.end("Sensitive upstream failure at https://private.example");
      } else if (mode === "malformed" || mode === "invalid-json") {
        response.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        response.end(
          mode === "malformed"
            ? JSON.stringify({ items: [{ title: "Unusable listing" }] })
            : "{invalid-json"
        );
      } else {
        const validation = mode === "validation";
        const status = validation ? 400 : 500;
        response.writeHead(status, {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
          ...(validation
            ? {}
            : { "X-Request-ID": "fixture-server-request-id" }),
        });
        response.end(
          JSON.stringify({
            status,
            code: validation ? "validation.failed" : "server.unexpected",
            title: "Sensitive backend title",
            detail: "Sensitive detail at https://private.example",
            traceId: validation
              ? "fixture-validation-trace-id"
              : "different-body-trace-id",
            ...(validation
              ? { errors: { q: ["Sensitive validation detail"] } }
              : {}),
          })
        );
      }
      return;
    }
  }

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  const candidates =
    emptyCatalogLocale === searchParams.get("lang")
      ? []
      : stressCatalogLocale === searchParams.get("lang")
        ? stressListings
        : q === "Paged"
          ? pagedListings
          : listings;
  const filtered = candidates.filter(
    (listing) =>
      (q !== "Family" || listing.title === "Family house") &&
      (!listingType || listing.listingType === listingType) &&
      (!propertyType || listing.propertyType === propertyType)
  );
  const totalPages = Math.ceil(filtered.length / 20);
  response.end(
    JSON.stringify({
      items: filtered.slice((page - 1) * 20, page * 20),
      page,
      pageSize: 20,
      totalCount: filtered.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    })
  );
}).listen(5231, "localhost");
