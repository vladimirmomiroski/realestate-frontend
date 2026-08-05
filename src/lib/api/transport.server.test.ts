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
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
} from "./api-error";
import { requestApi } from "./transport.server";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(body), { ...init, headers });
}

function getRequest() {
  const call = fetchMock.mock.calls[0];

  expect(call).toBeDefined();

  return {
    url: String(call![0]),
    init: call![1]!,
    headers: call![1]!.headers as Headers,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestApi request construction", () => {
  it("resolves a relative API path and deterministic query against the configured origin", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await requestApi({
      path: "/api/listings",
      query: { pageSize: 20, page: 0, active: false },
    });

    expect(getRequest().url).toBe(
      "https://api.example.test:8443/api/listings?active=false&page=0&pageSize=20"
    );
  });

  it.each([
    "https://attacker.example/api/listings",
    "//attacker.example/api/listings",
    "/api/../admin",
    "/api/%2e%2e/admin",
  ])("rejects an unsafe endpoint path: %s", async (path) => {
    await expect(requestApi({ path })).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("defaults Accept and permits a trusted override", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await requestApi({ path: "/api/health" });
    expect(getRequest().headers.get("Accept")).toBe("application/json");

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await requestApi({
      path: "/api/health",
      headers: { Accept: "application/vnd.realestate+json" },
    });
    expect(getRequest().headers.get("Accept")).toBe(
      "application/vnd.realestate+json"
    );
  });

  it("sets JSON content type only for a JSON body", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ created: true }, { status: 201 })
    );

    await requestApi({
      path: "/api/listings",
      method: "POST",
      body: { title: "Home" },
    });

    expect(getRequest().headers.get("Content-Type")).toBe("application/json");
    expect(getRequest().init.body).toBe('{"title":"Home"}');
  });

  it("allows FormData without a manual multipart boundary", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ uploaded: true }));
    const formData = new FormData();
    formData.set("file", new Blob(["image"]), "image.jpg");

    await requestApi({
      path: "/api/listings/id/images",
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=unsafe" },
      body: formData,
    });

    expect(getRequest().init.body).toBe(formData);
    expect(getRequest().headers.has("Content-Type")).toBe(false);
  });

  it("adds Bearer authorization only when explicitly supplied", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await requestApi({
      path: "/api/users/me",
      bearerToken: "server-token",
    });
    expect(getRequest().headers.get("Authorization")).toBe(
      "Bearer server-token"
    );

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await requestApi({
      path: "/api/health",
      headers: { Authorization: "Bearer untrusted-header" },
    });
    expect(getRequest().headers.has("Authorization")).toBe(false);
  });

  it("never sends X-Request-ID", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await requestApi({
      path: "/api/health",
      headers: { "X-Request-ID": "caller-supplied" },
    });

    expect(getRequest().headers.has("X-Request-ID")).toBe(false);
  });
});

describe("requestApi success responses", () => {
  const parseIdentifier = (value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value.id !== "string"
    ) {
      throw new TypeError("Expected an identifier response.");
    }

    return { id: value.id };
  };

  it.each([200, 201])(
    "parses a %s JSON response through an explicit parser",
    async (status) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: "listing-id" }, { status })
      );

      await expect(
        requestApi({ path: "/api/listings/id", parseJson: parseIdentifier })
      ).resolves.toEqual({ id: "listing-id" });
    }
  );

  it.each([204, 205])("returns undefined for status %s", async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));

    await expect(
      requestApi({ path: "/api/listings/id" })
    ).resolves.toBeUndefined();
  });

  it("returns undefined for a genuinely empty success", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(requestApi({ path: "/api/health" })).resolves.toBeUndefined();
  });

  it.each(["application/json", "application/vnd.realestate.resource+json"])(
    "parses the %s media type",
    async (contentType) => {
      fetchMock.mockResolvedValue(
        new Response('{"id":"listing-id"}', {
          status: 200,
          headers: { "Content-Type": contentType },
        })
      );

      await expect(
        requestApi({ path: "/api/listings/id", parseJson: parseIdentifier })
      ).resolves.toEqual({ id: "listing-id" });
    }
  );

  it("classifies malformed successful JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("{not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(requestApi({ path: "/api/health" })).rejects.toMatchObject({
      kind: "malformed-response",
      reason: "invalid-json",
      status: 200,
    });
  });

  it("classifies a successful body rejected by its parser", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }));

    await expect(
      requestApi({ path: "/api/listings/id", parseJson: parseIdentifier })
    ).rejects.toBeInstanceOf(MalformedApiResponseError);
  });
});

describe("requestApi failures", () => {
  const validationProblem = {
    type: "urn:realestate:error:validation.failed",
    title: "Validation failed",
    status: 400,
    detail: "One or more validation errors occurred.",
    instance: "/api/listings",
    code: "validation.failed",
    traceId: "body-request-id",
    errors: { CustomField: ["Required."] },
  };

  it("normalizes a canonical ProblemDetails failure without validation errors", async () => {
    const canonicalProblem = {
      type: "urn:realestate:error:resource.not_found",
      title: "Resource not found",
      status: 404,
      detail: "The requested resource was not found.",
      instance: "/api/listings/missing",
      code: "resource.not_found",
      traceId: "body-request-id",
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(canonicalProblem), {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      })
    );

    await expect(
      requestApi({ path: "/api/listings/missing" })
    ).rejects.toMatchObject({
      kind: "problem",
      problem: {
        status: 404,
        code: "resource.not_found",
        requestId: "body-request-id",
      },
    });
  });

  it.each([
    "application/problem+json",
    "application/vnd.realestate.problem+json",
  ])(
    "normalizes canonical validation failures from %s",
    async (contentType) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(validationProblem), {
          status: 400,
          headers: {
            "Content-Type": contentType,
            "X-Request-ID": "header-request-id",
          },
        })
      );

      await expect(requestApi({ path: "/api/listings" })).rejects.toMatchObject(
        {
          kind: "problem",
          problem: {
            status: 400,
            code: "validation.failed",
            requestId: "header-request-id",
            errors: { CustomField: ["Required."] },
          },
        }
      );
    }
  );

  it("retains status and request ID for a non-JSON HTTP failure", async () => {
    fetchMock.mockResolvedValue(
      new Response("Bad gateway", {
        status: 502,
        statusText: "Bad Gateway",
        headers: {
          "Content-Type": "text/plain",
          "X-Request-ID": "gateway-request-id",
        },
      })
    );

    await expect(requestApi({ path: "/api/health" })).rejects.toMatchObject({
      kind: "http",
      status: 502,
      requestId: "gateway-request-id",
      responseBody: "Bad gateway",
    });
  });

  it("classifies an ordinary network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("connection refused"));

    await expect(requestApi({ path: "/api/health" })).rejects.toBeInstanceOf(
      ApiNetworkError
    );
  });

  it("classifies an aborted request separately", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(
      requestApi({ path: "/api/health", signal: controller.signal })
    ).rejects.toBeInstanceOf(ApiAbortError);
  });

  it("does not retry a failed fetch", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));

    await expect(requestApi({ path: "/api/health" })).rejects.toBeInstanceOf(
      ApiNetworkError
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("uses the explicit error classes", () => {
    expect(ApiProblemError).toBeTypeOf("function");
    expect(ApiHttpError).toBeTypeOf("function");
  });
});
