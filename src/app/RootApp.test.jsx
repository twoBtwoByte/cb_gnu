import { describe, expect, it } from "vitest";
import { isLegacyPath } from "./RootApp.jsx";

describe("isLegacyPath", () => {
  it("matches v1 routes only", () => {
    expect(isLegacyPath("/v1")).toBe(true);
    expect(isLegacyPath("/v1/anything")).toBe(true);
    expect(isLegacyPath("/")).toBe(false);
    expect(isLegacyPath("/v10")).toBe(false);
  });
});
