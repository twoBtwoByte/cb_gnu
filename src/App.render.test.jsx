import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import { MATCH_CONFIGS, subscribeToUpdates } from "./services/worldCupService.js";

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
  default: () => <div>Group simulator</div>,
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
      allTeams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", probability: 12.5 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", probability: 12.5 },
        { code: "ESP", name: "Spain", flag: "🇪🇸", group: "H", probability: 0 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
    83: {
      teams: [
        { code: "POR", name: "Portugal", group: "K", probability: 12.5 },
        { code: "ENG", name: "England", group: "L", probability: 12.5 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 0 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
    subscribeToUpdates.mockImplementation((callback, intervalMs, bracket) => {
      const matchNumber = Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
      callback(livePayloadByMatch[matchNumber]);
      return vi.fn();
    });
  });

  it("shows spotlight selector at the top when no spotlight country is selected", async () => {
    render(<App />);

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--top");
    expect(
      screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
    ).not.toBeInTheDocument();
  });

  it("keeps selector at the top when URL spotlight country is invalid", async () => {
    window.history.replaceState({}, "", "/?country=NotARealCountry");
    render(<App />);

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--top");
    expect(
      screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })
    ).not.toBeInTheDocument();
  });

  it("uses a valid URL spotlight country and moves selector to the bottom", async () => {
    window.history.replaceState({}, "", "/?country=Canada");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" })
    ).toBeInTheDocument();

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--bottom");
  });

  it("updates URL and moves selector to bottom after selecting a valid spotlight country", async () => {
    render(<App />);
    const select = await screen.findByLabelText("Country");

    fireEvent.change(select, { target: { value: "CAN" } });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "🇨🇦 Canada's Probability" })
      ).toBeInTheDocument();
    });

    const selectorHeading = screen.getByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--bottom");
    expect(window.location.search).toContain("country=Canada");
  });
});
