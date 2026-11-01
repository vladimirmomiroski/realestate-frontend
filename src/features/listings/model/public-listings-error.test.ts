import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";
import {
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiProblemError,
  MalformedApiResponseError,
  normalizeApiProblem,
} from "@/lib/api/api-error";

import { publicListingsError } from "./public-listings-error";

for (const dictionary of [en, mk]) {
  describe(`${dictionary.locale.en} classified listing failures`, () => {
    const labels = dictionary.listings.failure;
    it.each([
      [400, "validation.failed", "validation"],
      [500, "server.unexpected", "server"],
      [400, "server.unexpected", "http"],
      [500, "validation.failed", "http"],
      [503, "unavailable", "http"],
    ] as const)("uses status %i and stable code %s", (status, code, key) => {
      const error = new ApiProblemError({
        status,
        code,
        title: "Sensitive title",
        detail: "Internal https://private.example/stack",
        requestId: "normalized-id",
      });
      expect(publicListingsError(error, labels)).toEqual({
        description: labels[key],
        requestId: "normalized-id",
      });
      expect(
        publicListingsError(
          new ApiProblemError({
            ...error.problem,
            title: "Поинаков наслов",
            detail: "Поинаков опис",
          }),
          labels
        )
      ).toEqual(publicListingsError(error, labels));
    });

    it.each([
      [
        new ApiHttpError(502, "Gateway", "http-id", "text/html", "<secret>"),
        "http",
        "http-id",
      ],
      [new ApiHttpError(429, "Rate limited"), "http", undefined],
      [
        new MalformedApiResponseError(200, "invalid-json", "json-id"),
        "malformed",
        "json-id",
      ],
      [
        new MalformedApiResponseError(200, "invalid-success-body"),
        "malformed",
        undefined,
      ],
      [
        new MalformedApiResponseError(200, "unexpected-content-type"),
        "malformed",
        undefined,
      ],
      [new ApiNetworkError(), "network", undefined],
    ] as const)(
      "maps classified %s without internal details",
      (error, key, requestId) => {
        expect(publicListingsError(error, labels)).toEqual({
          description: labels[key],
          ...(requestId ? { requestId } : {}),
        });
      }
    );

    it("uses the already normalized body-fallback ID unchanged", () => {
      const problem = normalizeApiProblem(
        {
          status: 500,
          code: "server.unexpected",
          title: "Internal",
          traceId: "00-genuine-body-trace-01",
        },
        500
      )!;
      expect(
        publicListingsError(new ApiProblemError(problem), labels)?.requestId
      ).toBe("00-genuine-body-trace-01");
    });

    it.each([
      new ApiAbortError(),
      new Error("Unexpected"),
      { kind: "network" },
      null,
    ])(
      "does not consume cancellation or unclassified exceptions %s",
      (error) => {
        expect(publicListingsError(error, labels)).toBeNull();
      }
    );
  });
}
