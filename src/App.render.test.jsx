import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import { MATCH_CONFIGS, generateGroupMatches, subscribeToUpdates } from "./services/worldCupService.js";

vi.mock("./components/CanadaHighlight.jsx", () => ({
  default: ({ canada }) => <div>{canada ? `${canada.name} ${canada.probability}` : "No Canada"}</div>,
}));

vi.mock("./components/ProbabilityList.jsx", () => ({
  default: () => <div>Probability list</div>,
}));

vi.mock("./components/TournamentPathSection.jsx", () => ({
  default: () => <div>Tournament paths</div>,
}));

vi.mock("./components/LastUpdated.jsx", () => ({
  default: () => <div>Last updated</div>,
}));

vi.mock("./components/GroupSimulator.jsx", () => ({
  default: ({ onAutoPopulate }) => (
    <div>
      Group simulator
      <button
        onClick={() => {
          const results = {};
          generateGroupMatches(["B"]).forEach((m) => {
            if (m.homeTeam.code === "QAT" || m.awayTeam.code === "QAT") {
              results[m.key] = m.homeTeam.code === "QAT"
                ? { homeScore: "3", awayScore: "0" }
                : { homeScore: "0", awayScore: "3" };
            } else {
              results[m.key] = { homeScore: "1", awayScore: "1" };
            }
          });
          onAutoPopulate(results);
        }}
      >
        Simulate Canada eliminated
      </button>
    </div>
  ),
}));

vi.mock("./services/worldCupService.js", async () => {
  const actual = await vi.importActual("./services/worldCupService.js");

  return {
    ...actual,
    subscribeToUpdates: vi.fn(),
    getTournamentPaths: vi.fn(() => []),
  };
});

describe("App Canada section visibility", () => {
  const livePayloadByMatch = {
    96: {
      teams: [
        { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
        { code: "POR", name: "Portugal", group: "K", probability: 12.5 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
    83: {
      teams: [
        { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
        { code: "POR", name: "Portugal", group: "K", probability: 12.5 },
        { code: "ENG", name: "England", group: "L", probability: 12.5 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    subscribeToUpdates.mockImplementation((callback, intervalMs, bracket) => {
      const matchNumber = Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
      callback(livePayloadByMatch[matchNumber]);
      return vi.fn();
    });
  });

  it("shows Canada's Probability when Canada has a non-zero chance in the selected match", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" })
    ).toBeInTheDocument();
  });

  it("hides Canada's Probability after selecting a match where Canada has a 0% chance", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" });
    fireEvent.click(screen.getByRole("button", { name: /Match 83/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
      ).not.toBeInTheDocument();
    });
  });

  it("updates Canada's Probability section based on simulator-entered scores", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" });
    fireEvent.click(screen.getByRole("tab", { name: /Simulator/i }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate Canada eliminated" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
      ).not.toBeInTheDocument();
    });
  });

  it("preserves simulator-entered scores when switching to another match", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" });
    fireEvent.click(screen.getByRole("tab", { name: /Simulator/i }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate Canada eliminated" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Match 83/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
      ).not.toBeInTheDocument();
    });
  });
});
