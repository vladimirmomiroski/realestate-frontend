import { describe, expect, it } from "vitest";

import {
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
  normalizeApiProblem,
} from "./api-error";

const validationProblem = {
  title: "Validation failed",
  status: 400,
  code: "validation.failed",
  detail: "One or more validation errors occurred.",
  instance: "/api/listings",
  traceId: "body-request-id",
  errors: { CustomField: ["Required."] },
};

describe("normalizeApiProblem", () => {
  it("prefers the response X-Request-ID over the body traceId", () => {
    expect(
      normalizeApiProblem(validationProblem, 400, "header-request-id")
    ).toEqual({
      status: 400,
      code: "validation.failed",
      title: "Validation failed",
      detail: "One or more validation errors occurred.",
      instance: "/api/listings",
      errors: { CustomField: ["Required."] },
      requestId: "header-request-id",
    });
  });

  it("falls back to the body traceId", () => {
    expect(normalizeApiProblem(validationProblem, 400)?.requestId).toBe(
      "body-request-id"
    );
  });

  it("does not invent a request ID", () => {
    const withoutTraceId: Partial<typeof validationProblem> = {
      ...validationProblem,
    };
    delete withoutTraceId.traceId;

    expect(normalizeApiProblem(withoutTraceId, 400)).not.toHaveProperty(
      "requestId"
    );
  });

  it("rejects non-canonical problem bodies", () => {
    expect(normalizeApiProblem({ message: "failed" }, 500)).toBeNull();
  });
});

describe("classified API errors", () => {
  it("provides stable typed classifications", () => {
    const problem = normalizeApiProblem(validationProblem, 400);

    expect(problem).not.toBeNull();
    expect(new ApiProblemError(problem!).kind).toBe("problem");
    expect(new ApiHttpError(502, "Bad Gateway").kind).toBe("http");
    expect(new MalformedApiResponseError(200, "invalid-json").kind).toBe(
      "malformed-response"
    );
    expect(new ApiNetworkError().kind).toBe("network");
    expect(new ApiAbortError().kind).toBe("aborted");
  });
});
