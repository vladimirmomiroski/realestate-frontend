import { describe, expect, it } from "vitest";

import { parseRuntimeEnvironment } from "./env";

const productionEnvironment = {
  NODE_ENV: "production",
  API_BASE_URL: "https://api.example.com",
  MEDIA_BASE_URL: "https://media.example.com",
  SITE_URL: "https://www.example.com",
} as const;

describe("parseRuntimeEnvironment", () => {
  it("uses documented localhost defaults outside production", () => {
    expect(parseRuntimeEnvironment({ NODE_ENV: "development" })).toEqual({
      API_BASE_URL: "http://localhost:5231",
      MEDIA_BASE_URL: "http://localhost:5231",
      SITE_URL: "http://localhost:3000",
    });
  });

  it("accepts HTTP and HTTPS origins", () => {
    expect(
      parseRuntimeEnvironment({
        NODE_ENV: "development",
        API_BASE_URL: "http://api.example.com:8080",
        MEDIA_BASE_URL: "https://media.example.com:8443",
        SITE_URL: "https://www.example.com",
      })
    ).toEqual({
      API_BASE_URL: "http://api.example.com:8080",
      MEDIA_BASE_URL: "https://media.example.com:8443",
      SITE_URL: "https://www.example.com",
    });
  });

  it("normalizes trailing slashes", () => {
    expect(
      parseRuntimeEnvironment({
        NODE_ENV: "development",
        API_BASE_URL: "http://localhost:5231/",
        MEDIA_BASE_URL: "http://localhost:5231/",
        SITE_URL: "http://localhost:3000/",
      })
    ).toEqual({
      API_BASE_URL: "http://localhost:5231",
      MEDIA_BASE_URL: "http://localhost:5231",
      SITE_URL: "http://localhost:3000",
    });
  });

  it.each(["API_BASE_URL", "MEDIA_BASE_URL", "SITE_URL"] as const)(
    "fails production configuration when %s is missing",
    (name) => {
      const environment: Record<string, string | undefined> = {
        ...productionEnvironment,
      };

      delete environment[name];

      expect(() => parseRuntimeEnvironment(environment)).toThrow(name);
    }
  );

  it.each([
    ["an invalid protocol", "ftp://api.example.com"],
    ["credentials", "https://user:secret@api.example.com"],
    ["a query", "https://api.example.com?version=1"],
    ["a fragment", "https://api.example.com#section"],
    ["a non-root path", "https://api.example.com/v1"],
  ])("rejects %s", (_case, API_BASE_URL) => {
    expect(() =>
      parseRuntimeEnvironment({
        ...productionEnvironment,
        API_BASE_URL,
      })
    ).toThrow("API_BASE_URL");
  });

  it("does not require the tooling-only OPENAPI_URL", () => {
    expect(parseRuntimeEnvironment(productionEnvironment)).toEqual({
      API_BASE_URL: productionEnvironment.API_BASE_URL,
      MEDIA_BASE_URL: productionEnvironment.MEDIA_BASE_URL,
      SITE_URL: productionEnvironment.SITE_URL,
    });
  });
});
