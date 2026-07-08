import { describe, expect, it } from "vitest";
import {
  toSlug,
  toCanonicalCountrySlug,
  isMatchReferenceLabel,
  extractBracketLabels,
  createKnockoutProbabilityEngine,
} from "../utils/knockoutEngine.js";

describe("knockoutEngine utility functions", () => {
  describe("toSlug", () => {
    it("converts text to lowercase slug", () => {
      expect(toSlug("United States")).toBe("united states");
      expect(toSlug("MEXICO")).toBe("mexico");
    });

    it("removes accents and special characters", () => {
      expect(toSlug("Türkiye")).toBe("turkiye");
      expect(toSlug("Côte d'Ivoire")).toBe("cote d ivoire");
      expect(toSlug("São Paulo")).toBe("sao paulo");
    });

    it("converts ampersands to 'and'", () => {
      expect(toSlug("Bosnia & Herzegovina")).toBe("bosnia and herzegovina");
      expect(toSlug("Trinidad & Tobago")).toBe("trinidad and tobago");
    });

    it("normalizes whitespace", () => {
      expect(toSlug("  Multiple   Spaces  ")).toBe("multiple spaces");
      expect(toSlug("Tab\tChar")).toBe("tab char");
    });

    it("handles empty values", () => {
      expect(toSlug("")).toBe("");
      expect(toSlug()).toBe("");
    });
  });

  describe("toCanonicalCountrySlug", () => {
    it("applies country aliases for common variations", () => {
      expect(toCanonicalCountrySlug("South Korea")).toBe("korea republic");
      expect(toCanonicalCountrySlug("United States")).toBe("usa");
      expect(toCanonicalCountrySlug("Ivory Coast")).toBe("cote d'ivoire");
      expect(toCanonicalCountrySlug("Iran")).toBe("ir iran");
      expect(toCanonicalCountrySlug("Cape Verde")).toBe("cabo verde");
      expect(toCanonicalCountrySlug("Cape Verde Islands")).toBe("cabo verde");
      expect(toCanonicalCountrySlug("DR Congo")).toBe("congo dr");
    });

    it("applies aliases case-insensitively", () => {
      expect(toCanonicalCountrySlug("SOUTH KOREA")).toBe("korea republic");
      expect(toCanonicalCountrySlug("united states")).toBe("usa");
    });

    it("handles Bosnia and Herzegovina variations", () => {
      expect(toCanonicalCountrySlug("Bosnia & Herzegovina")).toBe("bosnia and herzegovina");
      // Note: Bosnia-Herzegovina becomes "bosnia herzegovina" because the dash is removed
      // The alias only matches "bosnia herzegovina" (without the dash)
      expect(toCanonicalCountrySlug("Bosnia-Herzegovina")).toBe("bosnia herzegovina");
    });

    it("returns slug for non-aliased countries", () => {
      expect(toCanonicalCountrySlug("Canada")).toBe("canada");
      expect(toCanonicalCountrySlug("Mexico")).toBe("mexico");
      expect(toCanonicalCountrySlug("Brazil")).toBe("brazil");
    });
  });

  describe("isMatchReferenceLabel", () => {
    it("identifies winner references", () => {
      expect(isMatchReferenceLabel("Winner match 1")).toBe(true);
      expect(isMatchReferenceLabel("winner match 10")).toBe(true);
      expect(isMatchReferenceLabel("WINNER MATCH 99")).toBe(true);
    });

    it("identifies runner-up references", () => {
      expect(isMatchReferenceLabel("Runner-up match 1")).toBe(true);
      expect(isMatchReferenceLabel("runner-up match 20")).toBe(true);
      expect(isMatchReferenceLabel("RUNNER-UP MATCH 50")).toBe(true);
    });

    it("rejects non-match references", () => {
      expect(isMatchReferenceLabel("Canada")).toBe(false);
      expect(isMatchReferenceLabel("Group A winners")).toBe(false);
      expect(isMatchReferenceLabel("Third place")).toBe(false);
      expect(isMatchReferenceLabel("")).toBe(false);
      expect(isMatchReferenceLabel("match 1")).toBe(false);
      expect(isMatchReferenceLabel("Winner of match")).toBe(false);
    });
  });

  describe("extractBracketLabels", () => {
    it("extracts labels from bracket slots", () => {
      const match = {
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "Mexico" },
        },
      };
      expect(extractBracketLabels(match)).toEqual(["Canada", "Mexico"]);
    });

    it("filters out empty and invalid labels", () => {
      const match = {
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "" },
          slot3: { label: "  " },
          slot4: { label: null },
          slot5: {},
        },
      };
      expect(extractBracketLabels(match)).toEqual(["Canada"]);
    });

    it("trims whitespace from labels", () => {
      const match = {
        bracket: {
          slot1: { label: "  Canada  " },
          slot2: { label: "Mexico\t" },
        },
      };
      expect(extractBracketLabels(match)).toEqual(["Canada", "Mexico"]);
    });

    it("handles missing or invalid bracket", () => {
      expect(extractBracketLabels({})).toEqual([]);
      expect(extractBracketLabels({ bracket: null })).toEqual([]);
      expect(extractBracketLabels({ bracket: {} })).toEqual([]);
      expect(extractBracketLabels(null)).toEqual([]);
    });
  });
});

describe("createKnockoutProbabilityEngine", () => {
  const createGroupStageMatch = (matchNumber, team1, team2) => ({
    matchNumber,
    stage: "Group Stage",
    bracket: {
      slot1: { label: team1 },
      slot2: { label: team2 },
    },
  });

  const createKnockoutMatch = (matchNumber, ref1, ref2) => ({
    matchNumber,
    stage: "Round of 32",
    bracket: {
      slot1: { label: ref1 },
      slot2: { label: ref2 },
    },
  });

  describe("getMatchParticipation", () => {
    it("returns 100% probability for group stage teams", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const participation = engine.getMatchParticipation(1);

      expect(participation.get("Canada")).toBe(1);
      expect(participation.get("Mexico")).toBe(1);
      expect(participation.size).toBe(2);
    });

    it("returns empty map for non-existent match", () => {
      const engine = createKnockoutProbabilityEngine({ matchMap: new Map() });
      const participation = engine.getMatchParticipation(999);

      expect(participation.size).toBe(0);
    });

    it("calculates 50/50 probabilities for unresolved knockout matches", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
        [2, createGroupStageMatch(2, "USA", "Brazil")],
        [50, createKnockoutMatch(50, "Winner match 1", "Winner match 2")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const participation = engine.getMatchParticipation(50);

      expect(participation.get("Canada")).toBeCloseTo(0.5);
      expect(participation.get("Mexico")).toBeCloseTo(0.5);
      expect(participation.get("USA")).toBeCloseTo(0.5);
      expect(participation.get("Brazil")).toBeCloseTo(0.5);
    });

    it("adjusts probabilities based on completed match results", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
        [50, createKnockoutMatch(50, "Winner match 1", "Argentina")],
      ]);
      const completedResults = {
        1: { homeTeam: "Canada", awayTeam: "Mexico", homeScore: 2, awayScore: 1 },
      };
      const engine = createKnockoutProbabilityEngine({ matchMap, completedResults });
      const participation = engine.getMatchParticipation(50);

      expect(participation.get("Canada")).toBe(1);
      expect(participation.get("Mexico")).toBeUndefined();
      expect(participation.get("Argentina")).toBe(1);
    });

    it("handles runner-up references correctly", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
        [50, createKnockoutMatch(50, "Runner-up match 1", "Argentina")],
      ]);
      const completedResults = {
        1: { homeTeam: "Canada", awayTeam: "Mexico", homeScore: 2, awayScore: 1 },
      };
      const engine = createKnockoutProbabilityEngine({ matchMap, completedResults });
      const participation = engine.getMatchParticipation(50);

      expect(participation.get("Canada")).toBeUndefined();
      expect(participation.get("Mexico")).toBe(1);
      expect(participation.get("Argentina")).toBe(1);
    });

    it("handles draw results by using default probability", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
        [50, createKnockoutMatch(50, "Winner match 1", "Argentina")],
      ]);
      const completedResults = {
        1: { homeTeam: "Canada", awayTeam: "Mexico", homeScore: 1, awayScore: 1 },
      };
      const engine = createKnockoutProbabilityEngine({ matchMap, completedResults });
      const participation = engine.getMatchParticipation(50);

      // Draw should result in 50/50 split
      expect(participation.get("Canada")).toBeCloseTo(0.5);
      expect(participation.get("Mexico")).toBeCloseTo(0.5);
      expect(participation.get("Argentina")).toBe(1);
    });

    it("prevents infinite recursion in circular references", () => {
      const matchMap = new Map([
        [1, createKnockoutMatch(1, "Winner match 2", "Canada")],
        [2, createKnockoutMatch(2, "Winner match 1", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      
      // Should not throw and should return reasonable results
      expect(() => engine.getMatchParticipation(1)).not.toThrow();
      expect(() => engine.getMatchParticipation(2)).not.toThrow();
    });
  });

  describe("resolveLabelProbabilities", () => {
    it("returns 100% probability for concrete team labels", () => {
      const engine = createKnockoutProbabilityEngine({ matchMap: new Map() });
      const probabilities = engine.resolveLabelProbabilities("Canada");

      expect(probabilities.get("Canada")).toBe(1);
      expect(probabilities.size).toBe(1);
    });

    it("resolves winner references to participating teams", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const probabilities = engine.resolveLabelProbabilities("Winner match 1");

      expect(probabilities.get("Canada")).toBeCloseTo(0.5);
      expect(probabilities.get("Mexico")).toBeCloseTo(0.5);
    });

    it("resolves runner-up references to participating teams", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const probabilities = engine.resolveLabelProbabilities("Runner-up match 1");

      expect(probabilities.get("Canada")).toBeCloseTo(0.5);
      expect(probabilities.get("Mexico")).toBeCloseTo(0.5);
    });

    it("uses completed results to determine actual winner", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const completedResults = {
        1: { homeTeam: "Canada", awayTeam: "Mexico", homeScore: 3, awayScore: 1 },
      };
      const engine = createKnockoutProbabilityEngine({ matchMap, completedResults });
      const probabilities = engine.resolveLabelProbabilities("Winner match 1");

      expect(probabilities.get("Canada")).toBe(1);
      expect(probabilities.get("Mexico")).toBeUndefined();
    });

    it("handles country name aliases in completed results", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "USA", "Mexico")],
      ]);
      const completedResults = {
        1: { homeTeam: "United States", awayTeam: "Mexico", homeScore: 2, awayScore: 0 },
      };
      const engine = createKnockoutProbabilityEngine({ matchMap, completedResults });
      const probabilities = engine.resolveLabelProbabilities("Winner match 1");

      expect(probabilities.get("USA")).toBe(1);
      expect(probabilities.get("Mexico")).toBeUndefined();
    });
  });

  describe("getSlotProbabilities", () => {
    it("returns probability maps for each slot in a match", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const match = matchMap.get(1);
      const slotProbabilities = engine.getSlotProbabilities(match);

      expect(slotProbabilities).toHaveLength(2);
      expect(slotProbabilities[0].get("Canada")).toBe(1);
      expect(slotProbabilities[1].get("Mexico")).toBe(1);
    });

    it("handles knockout matches with uncertain participants", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
        [2, createGroupStageMatch(2, "USA", "Brazil")],
        [50, createKnockoutMatch(50, "Winner match 1", "Winner match 2")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const match = matchMap.get(50);
      const slotProbabilities = engine.getSlotProbabilities(match);

      expect(slotProbabilities).toHaveLength(2);
      expect(slotProbabilities[0].get("Canada")).toBeCloseTo(0.5);
      expect(slotProbabilities[0].get("Mexico")).toBeCloseTo(0.5);
      expect(slotProbabilities[1].get("USA")).toBeCloseTo(0.5);
      expect(slotProbabilities[1].get("Brazil")).toBeCloseTo(0.5);
    });

    it("limits to first two participants only", () => {
      const match = {
        matchNumber: 1,
        stage: "Group Stage",
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "Mexico" },
          slot3: { label: "USA" },
          slot4: { label: "Brazil" },
        },
      };
      const matchMap = new Map([[1, match]]);
      const engine = createKnockoutProbabilityEngine({ matchMap });
      const slotProbabilities = engine.getSlotProbabilities(match);

      expect(slotProbabilities).toHaveLength(2);
      expect(slotProbabilities[0].get("Canada")).toBe(1);
      expect(slotProbabilities[1].get("Mexico")).toBe(1);
    });
  });

  describe("cache behavior", () => {
    it("caches label probability results", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });

      const first = engine.resolveLabelProbabilities("Winner match 1");
      const second = engine.resolveLabelProbabilities("Winner match 1");

      expect(first).toBe(second); // Same object reference
    });

    it("caches match participation results", () => {
      const matchMap = new Map([
        [1, createGroupStageMatch(1, "Canada", "Mexico")],
      ]);
      const engine = createKnockoutProbabilityEngine({ matchMap });

      const first = engine.getMatchParticipation(1);
      const second = engine.getMatchParticipation(1);

      expect(first).toBe(second); // Same object reference
    });
  });
});
