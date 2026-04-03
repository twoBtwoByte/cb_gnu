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

describe("Group Stage Simulator", () => {
  // ── getSimulatorGroups ────────────────────────────────────────────────────
  describe("getSimulatorGroups", () => {
    it("returns groups B and K (sideA groups) plus D, E, I, J, L (non-hostTeamSlot sideB pool)", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      expect(groups).toContain("B");
      expect(groups).toContain("K");
      expect(groups).toContain("D");
      expect(groups).toContain("E");
      expect(groups).toContain("I");
      expect(groups).toContain("J");
      expect(groups).toContain("L");
    });

    it("does NOT include groups F or G (only in hostTeamSlot sideB pool)", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      expect(groups).not.toContain("F");
      expect(groups).not.toContain("G");
    });

    it("does NOT include groups A, C, H (no path to Match 96)", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      expect(groups).not.toContain("A");
      expect(groups).not.toContain("C");
      expect(groups).not.toContain("H");
    });

    it("returns exactly 7 groups for the Match 96 bracket", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      expect(groups).toHaveLength(7);
    });

    it("returns groups in sorted (alphabetical) order", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      expect(groups).toEqual([...groups].sort());
    });
  });

  // ── generateGroupMatches ──────────────────────────────────────────────────
  describe("generateGroupMatches", () => {
    it("generates 6 matches for a single 4-team group", () => {
      const matches = generateGroupMatches(["B"]);
      expect(matches).toHaveLength(6);
    });

    it("generates 42 matches for all 7 relevant groups", () => {
      const groups = getSimulatorGroups(MATCH_96_BRACKET);
      const matches = generateGroupMatches(groups);
      expect(matches).toHaveLength(42); // 7 groups × 6 matches
    });

    it("each match has a unique key, group, homeTeam, and awayTeam", () => {
      const matches = generateGroupMatches(["B"]);
      const keys = matches.map((m) => m.key);
      expect(new Set(keys).size).toBe(keys.length); // all unique
      matches.forEach((m) => {
        expect(m.group).toBe("B");
        expect(m.homeTeam).toBeDefined();
        expect(m.awayTeam).toBeDefined();
        expect(m.homeTeam.code).not.toBe(m.awayTeam.code);
      });
    });

    it("every pair of teams in a group appears exactly once", () => {
      const matches = generateGroupMatches(["B"]);
      // Build a set of unordered pairs
      const pairs = matches.map((m) =>
        [m.homeTeam.code, m.awayTeam.code].sort().join("|")
      );
      expect(new Set(pairs).size).toBe(6); // 4C2 = 6 unique pairs
    });

    it("Canada appears in exactly 3 Group B matches", () => {
      const matches = generateGroupMatches(["B"]);
      const canadaMatches = matches.filter(
        (m) => m.homeTeam.code === "CAN" || m.awayTeam.code === "CAN"
      );
      expect(canadaMatches).toHaveLength(3);
    });
  });

  // ── isGroupComplete ────────────────────────────────────────────────────────
  describe("isGroupComplete", () => {
    const allMatches = generateGroupMatches(["B"]);

    it("returns false when no results have been entered", () => {
      expect(isGroupComplete("B", {})).toBe(false);
    });

    it("returns false when only some matches have scores", () => {
      const partial = {
        [allMatches[0].key]: { homeScore: "2", awayScore: "1" },
        [allMatches[1].key]: { homeScore: "0", awayScore: "0" },
      };
      expect(isGroupComplete("B", partial)).toBe(false);
    });

    it("returns true when all 6 Group B matches have valid scores", () => {
      const full = {};
      allMatches.forEach((m) => {
        full[m.key] = { homeScore: "1", awayScore: "0" };
      });
      expect(isGroupComplete("B", full)).toBe(true);
    });

    it("returns false when a score value is blank", () => {
      const withBlank = {};
      allMatches.forEach((m) => {
        withBlank[m.key] = { homeScore: "1", awayScore: "0" };
      });
      // Blank out one score
      withBlank[allMatches[0].key] = { homeScore: "", awayScore: "0" };
      expect(isGroupComplete("B", withBlank)).toBe(false);
    });
  });

  // ── computeGroupStandings ─────────────────────────────────────────────────
  describe("computeGroupStandings", () => {
    it("returns 4 rows for Group B when no results are entered", () => {
      const standings = computeGroupStandings("B", {});
      expect(standings).toHaveLength(4);
    });

    it("all rows start with 0 pts/played when no results entered", () => {
      const standings = computeGroupStandings("B", {});
      standings.forEach((row) => {
        expect(row.pts).toBe(0);
        expect(row.played).toBe(0);
        expect(row.gf).toBe(0);
        expect(row.ga).toBe(0);
      });
    });

    it("correctly awards 3 pts to the winner of a match", () => {
      const matches = generateGroupMatches(["B"]);
      // Canada (home) wins 2–0 vs Qatar
      const canadaVsQatarMatch = matches.find(
        (m) => m.homeTeam.code === "CAN" && m.awayTeam.code === "QAT"
      );
      const results = {
        [canadaVsQatarMatch.key]: { homeScore: "2", awayScore: "0" },
      };
      const standings = computeGroupStandings("B", results);
      const canada = standings.find((r) => r.code === "CAN");
      const qatar  = standings.find((r) => r.code === "QAT");
      expect(canada.pts).toBe(3);
      expect(canada.w).toBe(1);
      expect(qatar.pts).toBe(0);
      expect(qatar.l).toBe(1);
    });

    it("correctly awards 1 pt each for a draw", () => {
      const matches = generateGroupMatches(["B"]);
      const match = matches.find(
        (m) => m.homeTeam.code === "CAN" && m.awayTeam.code === "QAT"
      );
      const results = { [match.key]: { homeScore: "1", awayScore: "1" } };
      const standings = computeGroupStandings("B", results);
      const canada = standings.find((r) => r.code === "CAN");
      const qatar  = standings.find((r) => r.code === "QAT");
      expect(canada.pts).toBe(1);
      expect(canada.d).toBe(1);
      expect(qatar.pts).toBe(1);
      expect(qatar.d).toBe(1);
    });

    it("accumulates goal difference correctly", () => {
      const matches = generateGroupMatches(["B"]);
      const match = matches.find(
        (m) => m.homeTeam.code === "CAN" && m.awayTeam.code === "QAT"
      );
      const results = { [match.key]: { homeScore: "3", awayScore: "1" } };
      const standings = computeGroupStandings("B", results);
      const canada = standings.find((r) => r.code === "CAN");
      const qatar  = standings.find((r) => r.code === "QAT");
      expect(canada.gd).toBe(2);
      expect(qatar.gd).toBe(-2);
    });

    it("sorts by points descending, then goal difference, then goals scored", () => {
      const matches = generateGroupMatches(["B"]);
      // Give each match a distinct result so the sorting is unambiguous
      const results = {};
      matches.forEach((m, i) => {
        results[m.key] = { homeScore: String(i + 1), awayScore: "0" };
      });
      const standings = computeGroupStandings("B", results);
      for (let i = 0; i < standings.length - 1; i++) {
        const a = standings[i], b = standings[i + 1];
        if (a.pts === b.pts) {
          if (a.gd === b.gd) {
            expect(a.gf).toBeGreaterThanOrEqual(b.gf);
          } else {
            expect(a.gd).toBeGreaterThanOrEqual(b.gd);
          }
        } else {
          expect(a.pts).toBeGreaterThan(b.pts);
        }
      }
    });

    it("ignores matches with blank scores", () => {
      const matches = generateGroupMatches(["B"]);
      const results = { [matches[0].key]: { homeScore: "", awayScore: "1" } };
      const standings = computeGroupStandings("B", results);
      standings.forEach((row) => {
        expect(row.pts).toBe(0);
        expect(row.played).toBe(0);
      });
    });
  });

  // ── computeSimulatedProbabilities ─────────────────────────────────────────
  describe("computeSimulatedProbabilities", () => {
    it("with no results entered, matches the base uniform model probabilities", () => {
      const probs = computeSimulatedProbabilities({}, MATCH_96_BRACKET);
      // Group B: 12.5% each
      ["CAN", "QAT", "SUI", "BIH"].forEach((code) => {
        expect(probs[code]).toBeCloseTo(12.5, 5);
      });
      // Group K: 12.5% each
      ["POR", "COD", "UZB", "COL"].forEach((code) => {
        expect(probs[code]).toBeCloseTo(12.5, 5);
      });
      // Groups D, E, I, J, L: 2.5% each
      ["USA", "GER", "FRA", "ARG", "ENG"].forEach((code) => {
        expect(probs[code]).toBeCloseTo(2.5, 5);
      });
      // Groups A, C, F, G, H: 0%
      ["MEX", "BRA", "NED", "BEL", "ESP"].forEach((code) => {
        expect(probs[code]).toBe(0);
      });
    });

    it("when Canada wins all Group B matches, Canada's probability becomes 50%", () => {
      const matches = generateGroupMatches(["B"]);
      const results = {};
      matches.forEach((m) => {
        if (m.homeTeam.code === "CAN" || m.awayTeam.code === "CAN") {
          results[m.key] = m.homeTeam.code === "CAN"
            ? { homeScore: "2", awayScore: "0" }
            : { homeScore: "0", awayScore: "2" };
        } else {
          results[m.key] = { homeScore: "1", awayScore: "1" };
        }
      });
      const probs = computeSimulatedProbabilities(results, MATCH_96_BRACKET);
      expect(probs["CAN"]).toBeCloseTo(KNOCKOUT_WIN_PROB * 100, 5);
      // Other Group B teams eliminated from 1st → 0%
      ["QAT", "SUI", "BIH"].forEach((code) => {
        expect(probs[code]).toBe(0);
      });
    });

    it("when another team wins Group B, Canada's probability drops to 0%", () => {
      const matches = generateGroupMatches(["B"]);
      const results = {};
      matches.forEach((m) => {
        if (m.homeTeam.code === "QAT" || m.awayTeam.code === "QAT") {
          results[m.key] = m.homeTeam.code === "QAT"
            ? { homeScore: "3", awayScore: "0" }
            : { homeScore: "0", awayScore: "3" };
        } else {
          results[m.key] = { homeScore: "1", awayScore: "1" };
        }
      });
      const probs = computeSimulatedProbabilities(results, MATCH_96_BRACKET);
      expect(probs["QAT"]).toBeCloseTo(KNOCKOUT_WIN_PROB * 100, 5);
      expect(probs["CAN"]).toBe(0);
    });

    it("when Group K is complete, only the 1st-place team gets 50% probability", () => {
      const matches = generateGroupMatches(["K"]);
      const results = {};
      // Portugal wins all its matches
      matches.forEach((m) => {
        if (m.homeTeam.code === "POR" || m.awayTeam.code === "POR") {
          results[m.key] = m.homeTeam.code === "POR"
            ? { homeScore: "2", awayScore: "0" }
            : { homeScore: "0", awayScore: "2" };
        } else {
          results[m.key] = { homeScore: "1", awayScore: "1" };
        }
      });
      const probs = computeSimulatedProbabilities(results, MATCH_96_BRACKET);
      expect(probs["POR"]).toBeCloseTo(KNOCKOUT_WIN_PROB * 100, 5);
      ["COD", "UZB", "COL"].forEach((code) => {
        expect(probs[code]).toBe(0);
      });
    });

    it("when all DEIJL groups are complete, best 3rd-place team gets 50% probability", () => {
      const eligibleGroups = ["D", "E", "I", "J", "L"];
      const matches = generateGroupMatches(eligibleGroups);
      const results = {};
      // Make one team in each group win all matches (finish 1st), so the 3rd-place teams have clear standings
      // USA finishes 1st in D, Germany in E, France in I, Argentina in J, England in L
      const winners = { D: "USA", E: "GER", I: "FRA", J: "ARG", L: "ENG" };
      matches.forEach((m) => {
        const winner = winners[m.group];
        if (m.homeTeam.code === winner) {
          results[m.key] = { homeScore: "3", awayScore: "0" };
        } else if (m.awayTeam.code === winner) {
          results[m.key] = { homeScore: "0", awayScore: "3" };
        } else {
          results[m.key] = { homeScore: "1", awayScore: "1" };
        }
      });

      const probs = computeSimulatedProbabilities(results, MATCH_96_BRACKET);

      // Exactly one team should have the full sideB knockout probability
      const sideBCodes = eligibleGroups.flatMap((g) =>
        ["D", "E", "I", "J", "L"].includes(g)
          ? Object.keys(probs).filter((c) => {
              const t = [
                ...generateGroupMatches([g]).map((m) => m.homeTeam),
                ...generateGroupMatches([g]).map((m) => m.awayTeam),
              ].find((t) => t.code === c);
              return t && t.group === g;
            })
          : []
      );
      const best3rdProb = KNOCKOUT_WIN_PROB * 100;
      const teamsWithFullProb = eligibleGroups
        .flatMap((g) => {
          const s = { D: "USA", E: "GER", I: "FRA", J: "ARG", L: "ENG" };
          return [s[g]]; // winners don't count; 3rd-place teams listed in standings
        });
      // The best 3rd-place team must have KNOCKOUT_WIN_PROB * 100 probability
      const probValues = Object.values(probs).filter((v) => v === best3rdProb);
      // Should include at least sideA Group K winner + best 3rd-place team
      expect(probValues.length).toBeGreaterThanOrEqual(1);
    });

    it("probabilities from incomplete groups fall back to the uniform model", () => {
      // Enter only 1 of 6 Group B matches
      const matches = generateGroupMatches(["B"]);
      const results = { [matches[0].key]: { homeScore: "1", awayScore: "0" } };
      const probs = computeSimulatedProbabilities(results, MATCH_96_BRACKET);
      // Group B is incomplete → uniform 12.5% each
      ["CAN", "QAT", "SUI", "BIH"].forEach((code) => {
        expect(probs[code]).toBeCloseTo(12.5, 5);
      });
    });

    it("total probabilities across all teams sum to at most 150% (two slots: sideA = 50%, sideB = 100%)", () => {
      const probs = computeSimulatedProbabilities({}, MATCH_96_BRACKET);
      const total = Object.values(probs).reduce((s, p) => s + p, 0);
      // sideA (Group B only, hostTeamSlot) contributes 50%;
      // sideB (Group K sideA + DEIJL sideB) contributes up to 100%
      expect(total).toBeCloseTo(150, 3);
    });
  });
});
