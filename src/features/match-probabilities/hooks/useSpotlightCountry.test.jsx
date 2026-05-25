import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useSpotlightCountry } from "./useSpotlightCountry.js";

const TEAM_OPTIONS = [
  { code: "CAN", name: "Canada", flag: "🇨🇦" },
  { code: "POR", name: "Portugal", flag: "🇵🇹" },
];

function Harness() {
  const spotlight = useSpotlightCountry(TEAM_OPTIONS);

  return (
    <>
      <div>{spotlight.selectedSpotlightTeamMeta?.name ?? "none"}</div>
      <button onClick={spotlight.handleQuickSelectCanada}>quick</button>
      <select aria-label="spotlight" value={spotlight.spotlightCode ?? ""} onChange={spotlight.handleSpotlightCountryChange}>
        <option value="">none</option>
        <option value="CAN">Canada</option>
        <option value="POR">Portugal</option>
      </select>
    </>
  );
}

describe("useSpotlightCountry", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("hydrates from the country query parameter", () => {
    window.history.replaceState({}, "", "/?country=Portugal");
    render(<Harness />);
    expect(screen.getByText("Portugal")).toBeInTheDocument();
  });

  it("updates the URL when quick-selecting Canada", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "quick" }));
    expect(screen.getByText("Canada")).toBeInTheDocument();
    expect(window.location.search).toContain("country=Canada");
  });
});
