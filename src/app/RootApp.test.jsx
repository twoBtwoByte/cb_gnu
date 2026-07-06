import { describe, expect, it } from "vitest";
import RootApp from "./RootApp.jsx";

describe("RootApp", () => {
  it("exports ScheduleExplorerApp", () => {
    expect(RootApp).toBeDefined();
  });
});
