import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MatchSelector from "./MatchSelector.jsx";
import { MATCH_CONFIGS } from "../../../config/worldCupConfig.js";

describe("MatchSelector", () => {
  it("defaults the venue filter to Toronto Stadium on first render", () => {
    render(
      <MatchSelector
        matches={Object.values(MATCH_CONFIGS)}
        defaultVenue="Toronto Stadium"
        selectedMatchNumber={83}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox", { name: "Venue" })).toHaveValue("Toronto Stadium");
    expect(
      screen.getByRole("button", {
        name: /match 83 round of 32 · toronto stadium, toronto/i,
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", {
        name: /match 96 round of 16 · bc place vancouver, vancouver/i,
      })
    ).not.toBeInTheDocument();
  });
});
