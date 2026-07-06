import { describe, expect, it } from "vitest";

// Helper functions extracted and tested independently
// These mirror the logic from scripts/fetchMatchResults.js

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia herzegovina", "bosnia and herzegovina"],
]);

function toCanonicalCountrySlug(value = "") {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return COUNTRY_ALIASES.get(slug) ?? slug;
}

function getMatchLabels(match) {
  return Object.values(match?.bracket ?? {})
    .map((slot) => (typeof slot?.label === "string" ? slot.label.trim() : ""))
    .filter(Boolean)
    .slice(0, 2);
}

function mapCompletedMatchesByNumber(scheduleData, apiMatches) {
  if (
    !Array.isArray(scheduleData) ||
    scheduleData.length === 0 ||
    !Array.isArray(apiMatches)
  ) {
    return {};
  }

  const matchLookup = new Map(
    scheduleData.map((match) => {
      const [team1Label = "", team2Label = ""] = getMatchLabels(match);
      const key = [toCanonicalCountrySlug(team1Label), toCanonicalCountrySlug(team2Label)]
        .sort()
        .join("|");
      return [key, match.matchNumber];
    })
  );

  return apiMatches.reduce((acc, apiMatch) => {
    const homeTeam = apiMatch?.homeTeam?.name ?? "";
    const awayTeam = apiMatch?.awayTeam?.name ?? "";
    const homeScore = apiMatch?.score?.fullTime?.home;
    const awayScore = apiMatch?.score?.fullTime?.away;

    if (
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      !homeTeam ||
      !awayTeam
    ) {
      return acc;
    }

    const key = [toCanonicalCountrySlug(homeTeam), toCanonicalCountrySlug(awayTeam)]
      .sort()
      .join("|");
    const matchNumber = matchLookup.get(key);
    if (!matchNumber) return acc;

    acc[matchNumber] = { homeTeam, awayTeam, homeScore, awayScore };
    return acc;
  }, {});
}

describe("fetchMatchResults script functions", () => {
  describe("toCanonicalCountrySlug (from script)", () => {
    it("converts text to lowercase slug", () => {
      expect(toCanonicalCountrySlug("United States")).toBe("usa");
      expect(toCanonicalCountrySlug("MEXICO")).toBe("mexico");
    });

    it("applies country aliases", () => {
      expect(toCanonicalCountrySlug("South Korea")).toBe("korea republic");
      expect(toCanonicalCountrySlug("United States")).toBe("usa");
      expect(toCanonicalCountrySlug("Ivory Coast")).toBe("cote d ivoire");
      expect(toCanonicalCountrySlug("Iran")).toBe("ir iran");
      expect(toCanonicalCountrySlug("Cape Verde")).toBe("cabo verde");
      expect(toCanonicalCountrySlug("DR Congo")).toBe("congo dr");
      expect(toCanonicalCountrySlug("Bosnia Herzegovina")).toBe("bosnia and herzegovina");
    });

    it("normalizes special characters and whitespace", () => {
      expect(toCanonicalCountrySlug("Côte d'Ivoire")).toBe("cote d ivoire");
      expect(toCanonicalCountrySlug("  Multiple   Spaces  ")).toBe("multiple spaces");
    });

    it("handles empty values", () => {
      expect(toCanonicalCountrySlug("")).toBe("");
      expect(toCanonicalCountrySlug()).toBe("");
    });
  });

  describe("getMatchLabels (from script)", () => {
    it("extracts first two labels from bracket", () => {
      const match = {
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "Mexico" },
        },
      };
      expect(getMatchLabels(match)).toEqual(["Canada", "Mexico"]);
    });

    it("trims whitespace from labels", () => {
      const match = {
        bracket: {
          slot1: { label: "  Canada  " },
          slot2: { label: " Mexico\t" },
        },
      };
      expect(getMatchLabels(match)).toEqual(["Canada", "Mexico"]);
    });

    it("filters out invalid labels", () => {
      const match = {
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "" },
          slot3: { label: "  " },
          slot4: {},
          slot5: { label: null },
        },
      };
      expect(getMatchLabels(match)).toEqual(["Canada"]);
    });

    it("limits to first two labels", () => {
      const match = {
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "Mexico" },
          slot3: { label: "USA" },
          slot4: { label: "Brazil" },
        },
      };
      expect(getMatchLabels(match)).toEqual(["Canada", "Mexico"]);
    });

    it("handles missing bracket", () => {
      expect(getMatchLabels({})).toEqual([]);
      expect(getMatchLabels({ bracket: null })).toEqual([]);
      expect(getMatchLabels(null)).toEqual([]);
    });
  });

  describe("mapCompletedMatchesByNumber (from script)", () => {
    const schedule = [
      {
        matchNumber: 1,
        bracket: {
          slot1: { label: "Canada" },
          slot2: { label: "Mexico" },
        },
      },
      {
        matchNumber: 2,
        bracket: {
          slot1: { label: "USA" },
          slot2: { label: "Brazil" },
        },
      },
      {
        matchNumber: 3,
        bracket: {
          slot1: { label: "Argentina" },
          slot2: { label: "Chile" },
        },
      },
    ];

    it("maps completed matches to match numbers", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Canada" },
          awayTeam: { name: "Mexico" },
          score: { fullTime: { home: 2, away: 1 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({
        1: {
          homeTeam: "Canada",
          awayTeam: "Mexico",
          homeScore: 2,
          awayScore: 1,
        },
      });
    });

    it("handles teams in reversed order (home/away swap)", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Mexico" },
          awayTeam: { name: "Canada" },
          score: { fullTime: { home: 1, away: 2 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result[1]).toBeDefined();
      expect(result[1]).toEqual({
        homeTeam: "Mexico",
        awayTeam: "Canada",
        homeScore: 1,
        awayScore: 2,
      });
    });

    it("maps multiple completed matches", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Canada" },
          awayTeam: { name: "Mexico" },
          score: { fullTime: { home: 2, away: 1 } },
        },
        {
          homeTeam: { name: "USA" },
          awayTeam: { name: "Brazil" },
          score: { fullTime: { home: 0, away: 3 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({
        1: {
          homeTeam: "Canada",
          awayTeam: "Mexico",
          homeScore: 2,
          awayScore: 1,
        },
        2: {
          homeTeam: "USA",
          awayTeam: "Brazil",
          homeScore: 0,
          awayScore: 3,
        },
      });
    });

    it("handles country name aliases in API results", () => {
      const apiMatches = [
        {
          homeTeam: { name: "United States" },
          awayTeam: { name: "Brazil" },
          score: { fullTime: { home: 1, away: 1 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result[2]).toBeDefined();
      expect(result[2]).toEqual({
        homeTeam: "United States",
        awayTeam: "Brazil",
        homeScore: 1,
        awayScore: 1,
      });
    });

    it("ignores matches not in schedule", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Germany" },
          awayTeam: { name: "France" },
          score: { fullTime: { home: 2, away: 2 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({});
    });

    it("ignores matches with missing scores", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Canada" },
          awayTeam: { name: "Mexico" },
          score: { fullTime: { home: null, away: 1 } },
        },
        {
          homeTeam: { name: "USA" },
          awayTeam: { name: "Brazil" },
          score: { fullTime: { home: 0 } },
        },
        {
          homeTeam: { name: "Argentina" },
          awayTeam: { name: "Chile" },
          score: {},
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({});
    });

    it("ignores matches with missing team names", () => {
      const apiMatches = [
        {
          homeTeam: { name: "" },
          awayTeam: { name: "Mexico" },
          score: { fullTime: { home: 2, away: 1 } },
        },
        {
          homeTeam: {},
          awayTeam: { name: "Brazil" },
          score: { fullTime: { home: 0, away: 1 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({});
    });

    it("handles zero scores correctly", () => {
      const apiMatches = [
        {
          homeTeam: { name: "Canada" },
          awayTeam: { name: "Mexico" },
          score: { fullTime: { home: 0, away: 0 } },
        },
      ];

      const result = mapCompletedMatchesByNumber(schedule, apiMatches);

      expect(result).toEqual({
        1: {
          homeTeam: "Canada",
          awayTeam: "Mexico",
          homeScore: 0,
          awayScore: 0,
        },
      });
    });

    it("returns empty object for invalid inputs", () => {
      expect(mapCompletedMatchesByNumber(null, [])).toEqual({});
      expect(mapCompletedMatchesByNumber([], [])).toEqual({});
      expect(mapCompletedMatchesByNumber(schedule, null)).toEqual({});
      expect(mapCompletedMatchesByNumber(schedule, undefined)).toEqual({});
      expect(mapCompletedMatchesByNumber([], null)).toEqual({});
    });
  });
});
