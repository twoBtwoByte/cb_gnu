import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ScheduleExplorerApp from "./ScheduleExplorerApp.jsx";

// The mock uses a mutable variable so individual tests can override seed data.
let mockSeedData = { requestedAt: "", resultsByMatchNumber: {} };
vi.mock("../../data/completedMatchResults.json", () => ({
  get default() {
    return mockSeedData;
  },
}));

describe("ScheduleExplorerApp", () => {
  beforeEach(() => {
    mockSeedData = { requestedAt: "", resultsByMatchNumber: {} };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders refresh action in footer beside other actions", async () => {
    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Host country" })).toBeEnabled());

    const footerActions = document.querySelector(".planner__footer-actions");
    const header = document.querySelector(".planner__hero");

    expect(footerActions).not.toBeNull();
    expect(header).not.toBeNull();
    expect(within(footerActions).getByRole("link", { name: /buy me a coffee/i })).toBeInTheDocument();
    expect(within(footerActions).queryByRole("button", { name: /refresh scores/i })).not.toBeInTheDocument();
    expect(within(footerActions).getByRole("button", { name: /refresh schedule/i })).toBeInTheDocument();
    expect(within(header).queryByRole("button", { name: /refresh schedule/i })).not.toBeInTheDocument();
  });

  it("uses updated country heading and hides 100% probability and single-entry slot labels", async () => {
    render(<ScheduleExplorerApp />);

    const teamCountrySelect = screen.getByRole("combobox", { name: "Team country" });
    await waitFor(() => expect(within(teamCountrySelect).getByRole("option", { name: "Canada" })).toBeInTheDocument());

    fireEvent.change(teamCountrySelect, {
      target: { value: "Canada" },
    });
    expect(screen.getByText(/Matches Canada may play in/i)).toBeInTheDocument();

    fireEvent.change(teamCountrySelect, {
      target: { value: "Bosnia and Herzegovina" },
    });

    const matchCard = screen.getByText("Match 3").closest("li");
    expect(matchCard).not.toBeNull();
    const scenarioList = within(matchCard).getByRole("list");
    expect(within(matchCard).queryByText(/Play probability: 100\.0%/i)).not.toBeInTheDocument();
    expect(within(scenarioList).getAllByRole("listitem")).toHaveLength(1);
    expect(within(scenarioList).queryByText(/Slot \d+:/i)).not.toBeInTheDocument();
  });

  it("shows completed match score data from seed JSON", async () => {
    mockSeedData = {
      requestedAt: "2024-06-14T00:00:00.000Z",
      resultsByMatchNumber: {
        3: { homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", homeScore: 2, awayScore: 1 },
      },
    };

    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team country" })).toBeEnabled());
    fireEvent.change(screen.getByRole("combobox", { name: "Team country" }), {
      target: { value: "Canada" },
    });

    expect(
      screen.getByText(/Final score: Canada 2 - 1 Bosnia and Herzegovina/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Scores last updated:/i)).toBeInTheDocument();
  });
});
