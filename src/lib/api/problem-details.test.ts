import { describe, expect, it } from "vitest";

import {
  isCanonicalProblemDetails,
  isValidationErrors,
  isValidationProblemDetails,
} from "./problem-details";

const canonicalProblem = {
  type: "urn:realestate:error:resource.not_found",
  title: "Resource not found",
  status: 404,
  detail: "The requested resource was not found.",
  instance: "/api/listings/missing",
  code: "resource.not_found",
  traceId: "trace-body",
};

describe("ProblemDetails guards", () => {
  it("accepts canonical ProblemDetails", () => {
    expect(isCanonicalProblemDetails(canonicalProblem)).toBe(true);
  });

  it("accepts validation ProblemDetails and preserves unknown field keys", () => {
    const validation = {
      ...canonicalProblem,
      status: 400,
      code: "validation.failed",
      errors: {
        "items[0].customField": ["A value is required."],
        unknownBackendKey: ["Unknown keys remain addressable."],
      },
    };

    expect(isValidationProblemDetails(validation)).toBe(true);
    expect(validation.errors.unknownBackendKey).toEqual([
      "Unknown keys remain addressable.",
    ]);
  });

  it.each([
    null,
    [],
    { ...canonicalProblem, status: "404" },
    { ...canonicalProblem, code: null },
    { ...canonicalProblem, title: "" },
    { ...canonicalProblem, errors: { field: "not-an-array" } },
    { ...canonicalProblem, errors: { field: ["valid", 2] } },
  ])("rejects an invalid JSON shape", (value) => {
    expect(isCanonicalProblemDetails(value)).toBe(false);
    expect(isValidationProblemDetails(value)).toBe(false);
  });

  it("guards validation error records independently", () => {
    expect(isValidationErrors({ field: ["one", "two"] })).toBe(true);
    expect(isValidationErrors({ field: ["one", null] })).toBe(false);
  });
});
