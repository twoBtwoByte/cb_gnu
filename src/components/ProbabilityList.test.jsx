import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProbabilityList from "./ProbabilityList.jsx";

describe("ProbabilityList", () => {
  it("renders the additional Match Side column", () => {
    render(
      <ProbabilityList
        teams={[
          {
            code: "CAN",
            name: "Canada",
            flag: "🇨🇦",
            confederation: "CONCACAF",
            probability: 12.5,
            team1Probability: 12.5,
            team2Probability: 0,
          },
        ]}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Match Side" })).toBeInTheDocument();
    expect(screen.getByText("team 1 (12.5%)")).toBeInTheDocument();
  });

  it("renders both sides on separate lines when team 1 and team 2 probabilities differ", () => {
    render(
      <ProbabilityList
        teams={[
          {
            code: "GER",
            name: "Germany",
            flag: "🇩🇪",
            confederation: "UEFA",
            probability: 3.0,
            team1Probability: 2.0,
            team2Probability: 1.0,
          },
        ]}
      />
    );

    expect(screen.getByText("team 1 (2.0%)")).toBeInTheDocument();
    expect(screen.getByText("team 2 (1.0%)")).toBeInTheDocument();
  });

  it("shows both team 1 & 2 when role probabilities are equal and above threshold", () => {
    render(
      <ProbabilityList
        teams={[
          {
            code: "POR",
            name: "Portugal",
            flag: "🇵🇹",
            confederation: "UEFA",
            probability: 5.0,
            team1Probability: 2.5,
            team2Probability: 2.5,
          },
        ]}
      />
    );

    expect(screen.getByText("both team 1 & 2 (2.5%)")).toBeInTheDocument();
  });
});
