import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadResolver(
  mediaBaseUrl = "http://localhost:5231"
): Promise<typeof import("./media-url").resolveMediaUrl> {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("API_BASE_URL", "http://localhost:5231");
  vi.stubEnv("MEDIA_BASE_URL", mediaBaseUrl);
  vi.stubEnv("SITE_URL", "http://localhost:3000");
  vi.resetModules();

  return (await import("./media-url")).resolveMediaUrl;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("resolveMediaUrl", () => {
  it("resolves valid upload paths", async () => {
    const resolveMediaUrl = await loadResolver();

    expect(resolveMediaUrl("/uploads/listings/photo.jpg")).toBe(
      "http://localhost:5231/uploads/listings/photo.jpg"
    );
  });

  it("preserves the configured protocol, hostname, and port", async () => {
    const resolveMediaUrl = await loadResolver(
      "https://media.example.com:8443"
    );

    expect(resolveMediaUrl("/uploads/photo.jpg")).toBe(
      "https://media.example.com:8443/uploads/photo.jpg"
    );
  });

  it.each([undefined, null, ""])(
    "returns null for absent input",
    async (input) => {
      const resolveMediaUrl = await loadResolver();

      expect(resolveMediaUrl(input)).toBeNull();
    }
  );

  it.each([
    ["an absolute URL", "https://example.com/uploads/photo.jpg"],
    ["a protocol-relative URL", "//example.com/uploads/photo.jpg"],
    ["an unrelated path", "/images/photo.jpg"],
    ["a similar non-upload prefix", "/uploads-other/photo.jpg"],
    ["a backslash", "/uploads/listings\\photo.jpg"],
    ["a query string", "/uploads/photo.jpg?version=1"],
    ["a fragment", "/uploads/photo.jpg#preview"],
  ])("rejects %s", async (_case, input) => {
    const resolveMediaUrl = await loadResolver();

    expect(resolveMediaUrl(input)).toBeNull();
  });

  it.each([
    "/uploads/../private/photo.jpg",
    "/uploads/listings/../../private/photo.jpg",
    "/uploads/%2e%2e/private/photo.jpg",
    "/uploads/%252e%252e/private/photo.jpg",
    "/uploads/%2f..%2fprivate/photo.jpg",
    "/uploads/listings/./photo.jpg",
  ])("rejects traversal or unsafe normalization: %s", async (input) => {
    const resolveMediaUrl = await loadResolver();

    expect(resolveMediaUrl(input)).toBeNull();
  });

  it("keeps the final URL on the configured origin and under uploads", async () => {
    const resolveMediaUrl = await loadResolver(
      "https://media.example.com:9443"
    );
    const result = resolveMediaUrl("/uploads/listings/photo%20one.jpg");
    const resolved = new URL(result ?? "https://invalid.example");

    expect(resolved.origin).toBe("https://media.example.com:9443");
    expect(resolved.pathname).toBe("/uploads/listings/photo%20one.jpg");
  });
});
