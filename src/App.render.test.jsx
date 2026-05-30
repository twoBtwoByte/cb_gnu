import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import { MATCH_CONFIGS } from "./services/worldCupService.js";
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
  default: () => <div>Group simulator</div>,
}));

describe("App match selector and spotlight behavior", () => {
  const livePayloadByMatch = {
    96: {
      teams: [],
      allTeams: [
        { code: "CAN", name: "Canada", flag: "🇨🇦", group: "B", confederation: "CONCACAF", probability: 0 },
        { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA", probability: 0 },
      ],
      canada: { code: "CAN", name: "Canada", group: "B", probability: 0 },
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
        callback(livePayloadByMatch[matchNumber] ?? livePayloadByMatch[96]);
        return vi.fn();
      }),
      getNotableProbabilities: vi.fn(async (bracket) => {
        const matchNumber =
          Object.values(MATCH_CONFIGS).find((config) => config.bracket === bracket)?.matchNumber ?? 96;
        return livePayloadByMatch[matchNumber] ?? livePayloadByMatch[96];
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

  it("uses a valid URL spotlight country and moves selector to the bottom", async () => {
    window.history.replaceState({}, "", "/?country=Canada");
    renderApp();

    const selectorHeading = await screen.findByRole("heading", { name: "🌟 Spotlight Country" });
    const selectorSection = selectorHeading.closest("section");
    expect(selectorSection).toHaveClass("app__spotlight-selector--bottom");
    expect(screen.queryByRole("heading", { name: "🇨🇦 Canada's Probability" })).not.toBeInTheDocument();
  });

  it("updates URL after selecting a valid spotlight country", async () => {
    renderApp();
    const select = await screen.findByLabelText("Country");

    fireEvent.change(select, { target: { value: "CAN" } });

    await waitFor(() => {
      expect(window.location.search).toContain("country=Canada");
    });

    expect(screen.getByLabelText("Country")).toHaveValue("CAN");
  });

  it("quick-select sets spotlight country to Canada", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Default: Canada" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Country")).toHaveValue("CAN");
    });
    expect(window.location.search).toContain("country=Canada");
  });

  it("defaults venue filter to no selection and shows matches from the updated range", async () => {
    renderApp();

    const venueSelect = await screen.findByLabelText("Venue");

    expect(venueSelect).toHaveValue("");
    expect(screen.getByRole("button", { name: /Match 73/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Match 96/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Match 104/i })).toBeInTheDocument();
  });

  it("filters matches to selected venue", async () => {
    renderApp();

    const venueSelect = await screen.findByLabelText("Venue");
    fireEvent.change(venueSelect, { target: { value: "Toronto Stadium" } });

    expect(screen.getByRole("button", { name: /Match 83/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Match 73/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Match 96/i })).not.toBeInTheDocument();
  });

  it("shows matchup participants in each match selector button", async () => {
    renderApp();

    await screen.findByRole("heading", { name: "🎯 Select a Match" });

    expect(screen.getByText("2A vs 2B")).toBeInTheDocument();
    expect(screen.getByText("W85 vs W87")).toBeInTheDocument();
    expect(screen.getByText("L101 vs L102")).toBeInTheDocument();
  });

  it("renders the improvement suggestions form collapsed by default", async () => {
    renderApp();

    await screen.findByRole("heading", { name: "🎯 Select a Match" });

    expect(screen.getByText("💡 Do you have improvement suggestions?")).toBeInTheDocument();
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
