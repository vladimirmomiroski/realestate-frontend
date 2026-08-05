import { describe, expect, it } from "vitest";

import { getClientDictionary } from "./client-dictionary";
import { en } from "./dictionaries/en";
import { mk } from "./dictionaries/mk";

describe("getClientDictionary", () => {
  it.each([en, mk])("selects only the approved client namespaces", (source) => {
    const clientDictionary = getClientDictionary(source);

    expect(Object.keys(clientDictionary)).toEqual([
      "common",
      "navigation",
      "theme",
      "locale",
      "errors",
      "accessibility",
    ]);
    expect(clientDictionary.common).toBe(source.common);
    expect(clientDictionary).not.toHaveProperty("metadata");
    expect(clientDictionary).not.toHaveProperty("home");
    expect(clientDictionary).not.toHaveProperty("listings");
  });
});
