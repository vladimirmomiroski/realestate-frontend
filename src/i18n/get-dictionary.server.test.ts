import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getDictionary } from "./get-dictionary.server";

describe("getDictionary", () => {
  it("loads only the requested locale dictionary", async () => {
    const [mk, en] = await Promise.all([
      getDictionary("mk"),
      getDictionary("en"),
    ]);

    expect(mk.locale.mk).toBe("Македонски");
    expect(en.locale.en).toBe("English");
    expect(mk.metadata.home.title).not.toBe(en.metadata.home.title);
  });
});
