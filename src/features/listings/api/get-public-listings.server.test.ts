import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/config/env.server", () => ({
  env: {
    API_BASE_URL: "https://api.example.test:8443",
    MEDIA_BASE_URL: "https://media.example.test",
    SITE_URL: "https://www.example.test",
  },
}));

import {
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
} from "@/lib/api/api-error";
import type { Page } from "@/lib/api/page";

import type { PublicListingCard } from "../model/public-listing-card";
import type { PublicListingsSuccessBody } from "./public-listings-contract";
import {
  getPublicListings,
  type GetPublicListingsInput,
} from "./get-public-listings.server";

const fetchMock = vi.fn<typeof fetch>();
const listing = {
  id: "b1b7479c-bdae-4d3b-9771-3150f96a6cd2",
  listingType: "Sale",
  propertyType: "Land",
  status: "Active",
  price: 90_000,
  currency: "EUR",
  areaSquareMeters: 400,
  title: "Building plot",
  languageCode: "en",
  city: "Skopje",
  municipality: "Centar",
  addressLine: "Example address",
  description: "Backend listing description",
  latitude: 42,
  longitude: 21.4,
  locationPrecision: "Street",
} satisfies PublicListingsSuccessBody["items"][number];

const successPage = {
  items: [listing],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
} satisfies PublicListingsSuccessBody;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function request() {
  const call = fetchMock.mock.calls[0];
  expect(call).toBeDefined();
  return {
    url: new URL(String(call![0])),
    init: call![1]!,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPublicListings", () => {
  it.each(["mk", "en"] as const)(
    "retrieves the anonymous public page for route locale %s",
    async (locale) => {
      fetchMock.mockResolvedValue(jsonResponse(successPage));

      const page: Page<PublicListingCard> = await getPublicListings({ locale });
      const { url, init } = request();

      expect(url.origin).toBe("https://api.example.test:8443");
      expect(url.pathname).toBe("/api/listings");
      expect([...url.searchParams]).toEqual([
        ["lang", locale],
        ["pageSize", "20"],
      ]);
      expect(init.method).toBe("GET");
      expect(init.cache).toBe("no-store");
      expect((init.headers as Headers).has("Authorization")).toBe(false);
      expect(page.items[0]).toMatchObject({
        propertyType: "Land",
        title: "Building plot",
        languageCode: "en",
      });
      expect(page).toMatchObject({ page: 1, pageSize: 20, totalCount: 1 });
      expect(JSON.stringify(page)).not.toContain(url.origin);
    }
  );

  it("forwards the supported generated query fields without sort or a page-size override", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        ...successPage,
        page: 3,
        totalCount: 41,
        totalPages: 3,
        hasPreviousPage: true,
      })
    );
    const input = {
      locale: "en",
      query: {
        q: "Skopje & Centar",
        listingType: "Rent",
        propertyType: "Commercial",
        page: 3,
      },
    } satisfies GetPublicListingsInput;

    await getPublicListings(input);

    expect([...request().url.searchParams]).toEqual([
      ["lang", "en"],
      ["listingType", "Rent"],
      ["page", "3"],
      ["pageSize", "20"],
      ["propertyType", "Commercial"],
      ["q", "Skopje & Centar"],
    ]);
    expect(request().url.searchParams.has("sort")).toBe(false);
  });

  it("omits a semantically empty keyword", async () => {
    fetchMock.mockResolvedValue(jsonResponse(successPage));

    await getPublicListings({ locale: "mk", query: { q: "" } });

    expect(request().url.searchParams.has("q")).toBe(false);
  });

  it("keeps malformed success classification and the backend request ID", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { ...successPage, items: [{ ...listing, title: null }] },
        { headers: { "X-Request-ID": "malformed-request-id" } }
      )
    );

    await expect(getPublicListings({ locale: "mk" })).rejects.toMatchObject({
      kind: "malformed-response",
      reason: "invalid-success-body",
      status: 200,
      requestId: "malformed-request-id",
    } satisfies Partial<MalformedApiResponseError>);
  });

  it("classifies an empty success as malformed", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(getPublicListings({ locale: "en" })).rejects.toMatchObject({
      kind: "malformed-response",
      reason: "invalid-success-body",
      status: 200,
    } satisfies Partial<MalformedApiResponseError>);
  });

  it("preserves ProblemDetails and correlation metadata", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: "urn:realestate:error:validation.failed",
          title: "Validation failed",
          status: 400,
          code: "validation.failed",
          traceId: "body-request-id",
          errors: { page: ["Invalid page."] },
        },
        { status: 400, headers: { "X-Request-ID": "header-request-id" } }
      )
    );

    await expect(getPublicListings({ locale: "mk" })).rejects.toMatchObject({
      kind: "problem",
      problem: {
        status: 400,
        code: "validation.failed",
        title: "Validation failed",
        requestId: "header-request-id",
        errors: { page: ["Invalid page."] },
      },
    } satisfies Partial<ApiProblemError>);
  });

  it("preserves the transport's network-failure classification", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(getPublicListings({ locale: "en" })).rejects.toBeInstanceOf(
      ApiNetworkError
    );
  });
});
