import { describe, expect, it } from "vitest";

import { serializeQueryParams, type QueryParams } from "./query-params";

describe("serializeQueryParams", () => {
  it("preserves zero and false", () => {
    expect(serializeQueryParams({ page: 0, published: false })).toBe(
      "page=0&published=false"
    );
  });

  it("omits null and undefined", () => {
    expect(
      serializeQueryParams({ city: null, query: undefined, page: 1 })
    ).toBe("page=1");
  });

  it("sorts keys deterministically without mutating the caller", () => {
    const input = { zebra: "last", alpha: "first", middle: 2 } as const;
    const snapshot = { ...input };

    expect(serializeQueryParams(input)).toBe("alpha=first&middle=2&zebra=last");
    expect(input).toEqual(snapshot);
  });

  it("uses stable URL encoding", () => {
    expect(serializeQueryParams({ city: "Скопје & Центар" })).toBe(
      "city=%D0%A1%D0%BA%D0%BE%D0%BF%D1%98%D0%B5+%26+%D0%A6%D0%B5%D0%BD%D1%82%D0%B0%D1%80"
    );
  });

  it("keeps empty strings unless the caller declares them semantically empty", () => {
    expect(serializeQueryParams({ city: "", query: "" })).toBe("city=&query=");
    expect(
      serializeQueryParams(
        { city: "", query: "" },
        { omitEmptyStringFor: ["query"] }
      )
    ).toBe("city=");
  });

  it("rejects unsupported runtime values", () => {
    const unsupported = { tags: ["house"] } as unknown as QueryParams;

    expect(() => serializeQueryParams(unsupported)).toThrow(TypeError);
  });
});
