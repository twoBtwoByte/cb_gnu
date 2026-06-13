import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ScheduleExplorerApp from "./ScheduleExplorerApp.jsx";

describe("ScheduleExplorerApp", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows slot labels and hides 100% probability details in host-country scenarios", async () => {
    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Host country" })).toBeEnabled());

    fireEvent.change(screen.getByRole("combobox", { name: "Host country" }), {
      target: { value: "Canada" },
    });

    const matchCard = screen.getByText("Match 3").closest("li");

    expect(screen.getByText("Matches in Canada")).toBeInTheDocument();
    expect(matchCard).not.toBeNull();
    expect(within(matchCard).getByText(/Slot 2:/i)).toBeInTheDocument();
    expect(within(matchCard).getByText("Bosnia and Herzegovina")).toBeInTheDocument();
    expect(within(matchCard).queryByText(/100\.0%/i)).not.toBeInTheDocument();
  });
});
