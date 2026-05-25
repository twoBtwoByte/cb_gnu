import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProbabilityList from "./ProbabilityList.jsx";

describe("ProbabilityList", () => {
  it("renders the additional Match Side column", () => {
    render(
      <ProbabilityList
        rows={[
          {
            id: "CAN",
            rank: 1,
            name: "Canada",
            flag: "🇨🇦",
            confederation: "CONCACAF",
            probabilityLabel: "12.5%",
            roleLines: ["team 1 (12.5%)"],
            isHighlighted: true,
            isHost: true,
            barWidth: 12.5,
          },
        ]}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Match Side" })).toBeInTheDocument();
    expect(screen.getByText("team 1 (12.5%)")).toBeInTheDocument();
  });

  it("renders both sides on separate lines when probabilities differ", () => {
    render(
      <ProbabilityList
        rows={[
          {
            id: "GER",
            rank: 1,
            name: "Germany",
            flag: "🇩🇪",
            confederation: "UEFA",
            probabilityLabel: "3.0%",
            roleLines: ["team 1 (2.0%)", "team 2 (1.0%)"],
            isHighlighted: false,
            isHost: false,
            barWidth: 3,
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
        rows={[
          {
            id: "POR",
            rank: 1,
            name: "Portugal",
            flag: "🇵🇹",
            confederation: "UEFA",
            probabilityLabel: "5.0%",
            roleLines: ["both team 1 & 2 (2.5%)"],
            isHighlighted: false,
            isHost: false,
            barWidth: 5,
          },
        ]}
      />
    );

    expect(screen.getByText("both team 1 & 2 (2.5%)")).toBeInTheDocument();
  });
});
