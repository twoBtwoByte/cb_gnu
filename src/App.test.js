import { describe, it, expect } from "vitest";
import {
  getMatchProbabilities,
  getNotableProbabilities,
  MATCH_INFO,
  MATCH_CONFIGS,
  MATCH_96_BRACKET,
  ELIMINATED_GROUP_STAGE_TEAM_CODES,
  ELIMINATED_GROUP_STAGE_TEAMS,
  KNOCKOUT_WIN_PROB,
  computeProbabilityForMatch,
  buildTeamPaths,
  getTournamentPaths,
} from "./services/worldCupService";

describe("worldCupService", () => {
  describe("MATCH_INFO", () => {
    it("targets Match 96", () => {
      expect(MATCH_INFO.matchNumber).toBe(96);
      expect(MATCH_INFO.stage).toBe("Round of 16");
      expect(MATCH_INFO.venue).toBe("BC Place Vancouver");
      expect(MATCH_INFO.city).toBe("Vancouver");
      expect(MATCH_INFO.scheduledDate).toBe("July 7, 2026");
    });
  });

  describe("MATCH_CONFIGS schema", () => {
    it("contains matches 73 through 104", () => {
      const keys = Object.keys(MATCH_CONFIGS).map(Number).sort((a, b) => a - b);
      expect(keys[0]).toBe(73);
      expect(keys[keys.length - 1]).toBe(104);
      expect(keys).toHaveLength(32);
    });

    it("stores bracket labels for round-of-32 matchups", () => {
      expect(MATCH_CONFIGS[73].bracket.slot1).toEqual({ label: "2A" });
      expect(MATCH_CONFIGS[73].bracket.slot2).toEqual({ label: "2B" });
      expect(MATCH_CONFIGS[88].bracket.slot1).toEqual({ label: "2G" });
      expect(MATCH_CONFIGS[88].bracket.slot2).toEqual({ label: "2D" });
    });

    it("stores upstream match links for knockout rounds", () => {
      expect(MATCH_CONFIGS[89].bracket.slot1).toEqual({ matchNumber: 74, label: "W74" });
      expect(MATCH_CONFIGS[89].bracket.slot2).toEqual({ matchNumber: 77, label: "W77" });
      expect(MATCH_CONFIGS[104].bracket.slot1).toEqual({ matchNumber: 101, label: "W101" });
      expect(MATCH_CONFIGS[104].bracket.slot2).toEqual({ matchNumber: 102, label: "W102" });
    });

    it("keeps venue and location metadata for each match", () => {
      Object.values(MATCH_CONFIGS).forEach((match) => {
        expect(typeof match.venue).toBe("string");
        expect(typeof match.city).toBe("string");
        expect(typeof match.country).toBe("string");
        expect(typeof match.description).toBe("string");
      });
    });
  });

  describe("KNOCKOUT_WIN_PROB", () => {
    it("is exactly 0.5", () => {
      expect(KNOCKOUT_WIN_PROB).toBe(0.5);
    });
  });

  describe("default bracket probabilities", () => {
    it("returns teams sorted by probability descending", async () => {
      const { teams } = await getMatchProbabilities();
      expect(teams.length).toBeGreaterThan(0);
      for (let i = 0; i < teams.length - 1; i++) {
        expect(teams[i].probability).toBeGreaterThanOrEqual(teams[i + 1].probability);
      }
    });

    it("returns notable teams above 1% for Match 96", async () => {
      const { teams, canada } = await getNotableProbabilities();
      expect(teams.length).toBeGreaterThan(0);
      expect(canada).toBeDefined();
      expect(canada.probability).toBeCloseTo(12.5, 5);
    });

    it("buildTeamPaths and getTournamentPaths return paths for Match 96 bracket", async () => {
      const { allTeams } = await getNotableProbabilities();
      expect(buildTeamPaths({ code: "CAN", group: "B" }).length).toBeGreaterThan(0);
      expect(getTournamentPaths(allTeams, MATCH_96_BRACKET).length).toBeGreaterThan(0);
    });

    it("lists teams eliminated after the group stage", () => {
      expect(ELIMINATED_GROUP_STAGE_TEAM_CODES).toEqual([
        "KOR",
        "CZE",
        "QAT",
        "HAI",
        "SCO",
        "TUR",
        "CUW",
        "TUN",
        "IRN",
        "NZL",
        "KSA",
        "URU",
        "IRQ",
        "JOR",
        "UZB",
        "PAN",
      ]);
      expect(ELIMINATED_GROUP_STAGE_TEAMS.map((team) => team.name)).toContain("Qatar");
    });

    it("returns zero knockout probability and no knockout paths for group-stage eliminated teams", () => {
      const qatar = { code: "QAT", group: "B" };

      expect(computeProbabilityForMatch(qatar, MATCH_96_BRACKET)).toBe(0);
      expect(buildTeamPaths(qatar, MATCH_96_BRACKET)).toEqual([]);
    });
  });

  describe("custom bracket compatibility", () => {
    const customBracket = {
      slot1: {
        r32Label: "Match 200",
        sideA: { group: "B", position: 1 },
        sideB: { group: "K", position: 2 },
      },
    };

    it("computeProbabilityForMatch still supports sideA/sideB bracket format", () => {
      const teamB = { code: "CAN", group: "B" };
      const teamK = { code: "POR", group: "K" };
      const teamA = { code: "MEX", group: "A" };
      const eliminatedTeamB = { code: "QAT", group: "B" };

      expect(computeProbabilityForMatch(teamB, customBracket)).toBeCloseTo(12.5, 5);
      expect(computeProbabilityForMatch(teamK, customBracket)).toBeCloseTo(12.5, 5);
      expect(computeProbabilityForMatch(teamA, customBracket)).toBe(0);
      expect(computeProbabilityForMatch(eliminatedTeamB, customBracket)).toBe(0);
    });

    it("buildTeamPaths supports custom brackets with sideA/sideB", () => {
      const paths = buildTeamPaths({ code: "CAN", group: "B" }, customBracket);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].r32Label).toBe("Match 200");
    });
  });
});
