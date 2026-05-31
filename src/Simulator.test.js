import { describe, it, expect } from "vitest";
import {
  MATCH_96_BRACKET,
  KNOCKOUT_WIN_PROB,
  getSimulatorGroups,
  generateGroupMatches,
  computeGroupStandings,
  isGroupComplete,
  computeSimulatedProbabilities,
} from "./services/worldCupService";

const customBracket = {
  slot1: {
    r32Label: "R32 Match 200",
    sideA: { group: "B", position: 1 },
    sideB: { group: "K", position: 2 },
  },
  slot2: {
    r32Label: "R32 Match 201",
    sideA: { group: "K", position: 1 },
    sideB: { thirdPlace: true, eligibleGroups: ["D", "E", "I", "J", "L"], label: "3DEIJL" },
  },
};

describe("Group Stage Simulator", () => {
  describe("getSimulatorGroups", () => {
    it("extracts groups from Match 96 bracket", () => {
      expect(getSimulatorGroups(MATCH_96_BRACKET)).toEqual(["B", "D", "E", "I", "J", "K", "L"]);
    });

    it("extracts sideA/sideB groups from legacy bracket structure", () => {
      const groups = getSimulatorGroups(customBracket);
      expect(groups).toEqual(["B", "D", "E", "I", "J", "K", "L"]);
    });
  });

  describe("generateGroupMatches", () => {
    it("generates 6 matches for one 4-team group", () => {
      expect(generateGroupMatches(["B"]).length).toBe(6);
    });

    it("generates 42 matches for seven groups", () => {
      expect(generateGroupMatches(["B", "D", "E", "I", "J", "K", "L"]).length).toBe(42);
    });
  });

  describe("isGroupComplete", () => {
    const groupMatches = generateGroupMatches(["B"]);

    it("returns false with no results", () => {
      expect(isGroupComplete("B", {})).toBe(false);
    });

    it("returns true when all matches have numeric scores", () => {
      const results = {};
      groupMatches.forEach((match) => {
        results[match.key] = { homeScore: "1", awayScore: "0" };
      });
      expect(isGroupComplete("B", results)).toBe(true);
    });
  });

  describe("computeGroupStandings", () => {
    it("returns four teams for Group B", () => {
      expect(computeGroupStandings("B", {})).toHaveLength(4);
    });

    it("awards points correctly for a win", () => {
      const match = generateGroupMatches(["B"]).find(
        (item) => item.homeTeam.code === "CAN" && item.awayTeam.code === "QAT"
      );
      const standings = computeGroupStandings("B", {
        [match.key]: { homeScore: "2", awayScore: "0" },
      });
      const canada = standings.find((row) => row.code === "CAN");
      const qatar = standings.find((row) => row.code === "QAT");
      expect(canada.pts).toBe(3);
      expect(qatar.pts).toBe(0);
    });
  });

  describe("computeSimulatedProbabilities", () => {
    it("returns non-zero probabilities for Match 96 bracket teams", () => {
      const probs = computeSimulatedProbabilities({}, MATCH_96_BRACKET);
      expect(probs.CAN).toBeCloseTo(12.5, 5);
      expect(probs.POR).toBeCloseTo(12.5, 5);
      expect(probs.USA).toBeCloseTo(2.5, 5);
    });

    it("supports sideA/sideB custom brackets", () => {
      const probs = computeSimulatedProbabilities({}, customBracket);
      expect(probs.CAN).toBeCloseTo((1 / 4) * KNOCKOUT_WIN_PROB * 100, 5);
      expect(probs.POR).toBeGreaterThan(0);
    });
  });
});
