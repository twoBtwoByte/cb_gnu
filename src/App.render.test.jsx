import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import { MATCH_CONFIGS, generateGroupMatches } from "./services/worldCupService.js";
import { ServicesProvider, defaultServices } from "./application/ServicesContext.jsx";

vi.mock("./components/SpotlightCountryCard.jsx", () => ({
  default: ({ name, probability }) => <div>{name ? `${name} ${probability}` : "No spotlight"}</div>,
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
          generateGroupMatches(["B"]).forEach((match) => {
            if (match.homeTeam.code === "QAT" || match.awayTeam.code === "QAT") {
              results[match.key] =
                match.homeTeam.code === "QAT"
                  ? { homeScore: "3", awayScore: "0" }
                  : { homeScore: "0", awayScore: "3" };
            } else {
              results[match.key] = { homeScore: "1", awayScore: "1" };
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

describe("App Canada section visibility", () => {
  const livePayloadByMatch = {
    96: {
      teams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", probability: 12.5 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", probability: 12.5 },
      ],
      allTeams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", confederation: "CONCACAF", probability: 12.5 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA", probability: 12.5 },
        { code: "ESP", name: "Spain", flag: "🇪🇸", group: "H", confederation: "UEFA", probability: 0 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
    83: {
      teams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", probability: 12.5 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", probability: 12.5 },
        { code: "ENG", name: "England", flag: "🏴", group: "L", probability: 12.5 },
      ],
      allTeams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", confederation: "CONCACAF", probability: 12.5 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA", probability: 12.5 },
        { code: "ENG", name: "England", flag: "🏴", group: "L", confederation: "UEFA", probability: 12.5 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 12.5 },
      matchesCompleted: 0,
      lastUpdated: new Date("2026-07-01T00:00:00Z"),
    },
  };

  let probabilityRepository;
  let pathBuilder;

  const renderApp = () =>
    render(
      <ServicesProvider
        services={{
          probabilityRepository,
          pathBuilder,
        }}
      >
        <App />
      </ServicesProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");

    probabilityRepository = {
      ...defaultServices.probabilityRepository,
      subscribeToUpdates: vi.fn((callback, intervalMs, bracket) => {
        const matchNumber =
          Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
        callback(livePayloadByMatch[matchNumber]);
        return vi.fn();
      }),
      getNotableProbabilities: vi.fn(async (bracket) => {
        const matchNumber =
          Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
        return livePayloadByMatch[matchNumber];
      }),
    };

    pathBuilder = {
      ...defaultServices.pathBuilder,
      getTournamentPaths: vi.fn(() => []),
    };
  });

  it("shows spotlight selector at the top when no spotlight country is selected", async () => {
    renderApp();

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--top");
    expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
  });

  it("keeps selector at the top when URL spotlight country is invalid", async () => {
    window.history.replaceState({}, "", "/?country=NotARealCountry");
    renderApp();

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--top");
    expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
  });

  it("uses a valid URL spotlight country and moves selector to the bottom", async () => {
    window.history.replaceState({}, "", "/?country=Canada");
    renderApp();

    expect(await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" })).toBeInTheDocument();

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--bottom");
  });

  it("updates URL and moves selector to bottom after selecting a valid spotlight country", async () => {
    renderApp();
    const select = await screen.findByLabelText("Country");

    fireEvent.change(select, { target: { value: "CAN" } });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "🇨🇦 Canada's Probability" })).toBeInTheDocument();
    });

    const selectorHeading = screen.getByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--bottom");
    expect(window.location.search).toContain("country=Canada");
  });

  it("quick-select link sets spotlight country to Canada", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Default: Canada" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "🇨🇦 Canada's Probability" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Country")).toHaveValue("CAN");
    expect(window.location.search).toContain("country=Canada");
  });

  it("updates Canada's Probability section based on simulator-entered scores", async () => {
    renderApp();

    fireEvent.change(await screen.findByLabelText("Country"), { target: { value: "CAN" } });
    await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" });
    fireEvent.click(screen.getByRole("tab", { name: /Simulator/i }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate Canada eliminated" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
      expect(screen.queryByText("Canada 0")).not.toBeInTheDocument();
    });
  });

  it("updates Canada's Probability value when switching to another match", async () => {
    probabilityRepository.subscribeToUpdates.mockImplementation((callback, intervalMs, bracket) => {
      const matchNumber =
        Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
      callback(livePayloadByMatch[matchNumber]);
      return vi.fn();
    });

    renderApp();

    fireEvent.change(await screen.findByLabelText("Country"), { target: { value: "CAN" } });
    await screen.findByRole("heading", { name: "🇨🇦 Canada's Probability" });
    expect(screen.getByText("Canada 12.5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Simulator/i }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate Canada eliminated" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Match 83/i }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
    });
  });

  it("defaults venue filter to no selection and shows all matches", async () => {
    renderApp();

    const venueSelect = await screen.findByLabelText("Venue");

    expect(venueSelect).toHaveValue("");
    expect(screen.getByRole("button", { name: /Match 83/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Match 85/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Match 96/i })).toBeInTheDocument();
  });

  it("filters matches to selected venue", async () => {
    renderApp();

    const venueSelect = await screen.findByLabelText("Venue");
    fireEvent.change(venueSelect, { target: { value: "Toronto Stadium, Toronto" } });

    expect(screen.getByRole("button", { name: /Match 83/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Match 85/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Match 96/i })).not.toBeInTheDocument();
  });

  it("shows matchup participants in each match selector button", async () => {
    renderApp();

    await screen.findByRole("heading", { name: "🎯 Select a Match" });

    expect(screen.getByText("2K vs 2L")).toBeInTheDocument();
    expect(screen.getByText("1B vs 3EFGIJ")).toBeInTheDocument();
    expect(screen.getByText("W85 vs W87")).toBeInTheDocument();
  });

  it("renders the improvement suggestions form collapsed by default", async () => {
    renderApp();

    await screen.findByRole("heading", { name: "🎯 Select a Match" });

    expect(
      screen.getByText("💡 Do you have improvement suggestions?")
    ).toBeInTheDocument();
    const feedbackHeading = screen.getByRole("heading", { name: "Help improve this tracker" });
    const feedbackButton = screen.getByRole("button", { name: "Open feedback issue" });
    expect(feedbackHeading).not.toBeVisible();
    expect(feedbackButton).not.toBeVisible();
    const feedbackDetails = screen
      .getByPlaceholderText(/What would you like to improve\?/i)
      .closest("details");
    expect(feedbackDetails).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("💡 Do you have improvement suggestions?"));
    expect(feedbackDetails).toHaveAttribute("open");
    expect(feedbackHeading).toBeVisible();
    expect(feedbackButton).toBeVisible();
  });
});
