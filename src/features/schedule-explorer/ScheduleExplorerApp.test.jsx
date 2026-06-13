import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScheduleExplorerApp from "./ScheduleExplorerApp.jsx";

describe("ScheduleExplorerApp", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows slot labels and hides 100% probability details in host-country scenarios", async () => {
    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Host country" })).toBeEnabled());

    fireEvent.change(screen.getByRole("combobox", { name: "Host country" }), {
      target: { value: "Canada" },
    });

    expect(screen.getByText("Matches in Canada")).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "Slot 2: Bosnia and Herzegovina")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Bosnia and Herzegovina: 100\.0%/i)).not.toBeInTheDocument();
  });
});
