import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ScheduleExplorerApp from "./ScheduleExplorerApp.jsx";

const SCHEDULE_URL = "worldCup2026Schedule.json";
const RESULTS_URL = "completedMatchResults.json";

// The mock uses a mutable variable so individual tests can override seed data.
let mockSeedData = { requestedAt: "", resultsByMatchNumber: {} };
vi.mock("../../../public/data/completedMatchResults.json", () => ({
  get default() {
    return mockSeedData;
  },
}));

const createFetchMock = ({ scheduleRejects = true, resultsPayload = null, resultsRejects = true } = {}) =>
  vi.fn((url) => {
    const urlString = String(url);
    if (urlString.includes(SCHEDULE_URL)) {
      if (scheduleRejects) {
        return Promise.reject(new Error("network error"));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (urlString.includes(RESULTS_URL)) {
      if (resultsRejects) {
        return Promise.reject(new Error("network error"));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resultsPayload),
      });
    }
    return Promise.reject(new Error(`unexpected fetch url: ${urlString}`));
  });

describe("ScheduleExplorerApp", () => {
  beforeEach(() => {
    mockSeedData = { requestedAt: "", resultsByMatchNumber: {} };
    vi.stubGlobal("fetch", createFetchMock());
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage?.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders refresh action in footer beside other actions", async () => {
    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Host country" })).toBeEnabled());

    const footerActions = document.querySelector(".planner__footer-actions");
    const header = document.querySelector(".planner__hero");

    expect(footerActions).not.toBeNull();
    expect(header).not.toBeNull();
    expect(within(footerActions).getByRole("link", { name: /buy me a coffee/i })).toBeInTheDocument();

    const refreshScoresButton = within(footerActions).getByRole("button", { name: /refresh scores/i });
    const refreshScheduleButton = within(footerActions).getByRole("button", { name: /refresh schedule/i });
    expect(refreshScoresButton).toBeInTheDocument();
    expect(refreshScheduleButton).toBeInTheDocument();

    const footerButtons = within(footerActions).getAllByRole("button");
    expect(footerButtons.indexOf(refreshScoresButton)).toBeLessThan(
      footerButtons.indexOf(refreshScheduleButton)
    );
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

  it("updates scores when Refresh scores is clicked and remote fetch succeeds", async () => {
    mockSeedData = {
      requestedAt: "2024-06-14T00:00:00.000Z",
      resultsByMatchNumber: {
        3: { homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", homeScore: 1, awayScore: 0 },
      },
    };

    vi.stubGlobal(
      "fetch",
      createFetchMock({
        resultsRejects: false,
        resultsPayload: {
          requestedAt: "2026-06-30, 12:00:00 EDT",
          resultsByMatchNumber: {
            3: { homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", homeScore: 3, awayScore: 2 },
          },
        },
      })
    );

    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team country" })).toBeEnabled());

    fireEvent.change(screen.getByRole("combobox", { name: "Team country" }), {
      target: { value: "Canada" },
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Final score: Canada 3 - 2 Bosnia and Herzegovina/i)
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/Scores last updated: 2026-06-30, 12:00:00 EDT/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /refresh scores/i }));

    await waitFor(() => {
      const resultsFetchCalls = fetch.mock.calls.filter(([url]) =>
        String(url).includes(RESULTS_URL)
      );
      expect(resultsFetchCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("keeps seed scores and shows warning when remote results fetch fails", async () => {
    mockSeedData = {
      requestedAt: "2024-06-14T00:00:00.000Z",
      resultsByMatchNumber: {
        3: { homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", homeScore: 2, awayScore: 1 },
      },
    };

    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team country" })).toBeEnabled());

    await waitFor(() =>
      expect(
        screen.getByText(/Using cached match results because the latest remote results could not be loaded/i)
      ).toBeInTheDocument()
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Team country" }), {
      target: { value: "Canada" },
    });

    expect(
      screen.getByText(/Final score: Canada 2 - 1 Bosnia and Herzegovina/i)
    ).toBeInTheDocument();
  });

  it("polls match results every hour", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<ScheduleExplorerApp />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const initialResultsFetchCount = fetch.mock.calls.filter(([url]) =>
      String(url).includes(RESULTS_URL)
    ).length;
    expect(initialResultsFetchCount).toBeGreaterThanOrEqual(1);

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    const afterHourResultsFetchCount = fetch.mock.calls.filter(([url]) =>
      String(url).includes(RESULTS_URL)
    ).length;
    expect(afterHourResultsFetchCount).toBeGreaterThan(initialResultsFetchCount);
  });
});
