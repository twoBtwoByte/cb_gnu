import { describe, it, expect } from "vitest";
import {
  getMatchProbabilities,
  getNotableProbabilities,
  MATCH_INFO,
  MATCH_96_BRACKET,
  KNOCKOUT_WIN_PROB,
  buildTeamPaths,
  getTournamentPaths,
} from "./services/worldCupService";

describe("worldCupService", () => {
  describe("MATCH_INFO", () => {
    it("should describe Match 96 at BC Place, Vancouver", () => {
      expect(MATCH_INFO.matchNumber).toBe(96);
      expect(MATCH_INFO.venue).toBe("BC Place");
      expect(MATCH_INFO.city).toBe("Vancouver");
    });

    it("should be a Round of 16 match on July 7, 2026", () => {
      expect(MATCH_INFO.stage).toBe("Round of 16");
      expect(MATCH_INFO.scheduledDate).toBe("July 7, 2026");
    });
  });

  describe("KNOCKOUT_WIN_PROB", () => {
    it("is exactly 0.5 (50/50 chance in any knockout match)", () => {
      expect(KNOCKOUT_WIN_PROB).toBe(0.5);
    });
  });

  describe("uniform probability model", () => {
    it("every team in a 4-team group (C or D) on the Match 96 path has probability 12.5%", async () => {
      const { teams } = await getMatchProbabilities();
      const groupCTeams = teams.filter((t) => t.group === "C");
      const groupDTeams = teams.filter((t) => t.group === "D");
      expect(groupCTeams.length).toBeGreaterThan(0);
      expect(groupDTeams.length).toBeGreaterThan(0);
      [...groupCTeams, ...groupDTeams].forEach((t) => {
        expect(t.probability).toBeCloseTo(12.5, 5);
      });
    });

    it("every team in a 5-team group (B or E) on the Match 96 path has probability 10.0%", async () => {
      const { teams } = await getMatchProbabilities();
      const groupBTeams = teams.filter((t) => t.group === "B");
      const groupETeams = teams.filter((t) => t.group === "E");
      expect(groupBTeams.length).toBeGreaterThan(0);
      expect(groupETeams.length).toBeGreaterThan(0);
      [...groupBTeams, ...groupETeams].forEach((t) => {
        expect(t.probability).toBeCloseTo(10.0, 5);
      });
    });

    it("teams not on the Match 96 path have probability 0%", async () => {
      const { teams } = await getMatchProbabilities();
      const offPathGroups = ["A", "F", "G", "H", "I", "J", "K", "L"];
      const offPath = teams.filter((t) => offPathGroups.includes(t.group));
      expect(offPath.length).toBeGreaterThan(0);
      offPath.forEach((t) => {
        expect(t.probability).toBe(0);
      });
    });

    it("Canada has the same probability as every other Group C team", async () => {
      const { teams } = await getMatchProbabilities();
      const canada = teams.find((t) => t.code === "CAN");
      const groupC = teams.filter((t) => t.group === "C");
      expect(canada).toBeDefined();
      groupC.forEach((t) => {
        expect(t.probability).toBeCloseTo(canada.probability, 5);
      });
    });
  });

  describe("getMatchProbabilities", () => {
    it("returns a list of teams sorted by probability descending", async () => {
      const { teams } = await getMatchProbabilities();
      expect(teams.length).toBeGreaterThan(0);
      for (let i = 0; i < teams.length - 1; i++) {
        expect(teams[i].probability).toBeGreaterThanOrEqual(teams[i + 1].probability);
      }
    });

    it("includes Canada in the results", async () => {
      const { teams } = await getMatchProbabilities();
      const canada = teams.find((t) => t.code === "CAN");
      expect(canada).toBeDefined();
      expect(canada.name).toBe("Canada");
    });

    it("all teams have a group property", async () => {
      const { teams } = await getMatchProbabilities();
      teams.forEach((t) => {
        expect(typeof t.group).toBe("string");
        expect(t.group.length).toBe(1);
      });
    });

    it("returns a lastUpdated Date", async () => {
      const { lastUpdated } = await getMatchProbabilities();
      expect(lastUpdated).toBeInstanceOf(Date);
    });

    it("returns matchesCompleted as a non-negative number", async () => {
      const { matchesCompleted } = await getMatchProbabilities();
      expect(typeof matchesCompleted).toBe("number");
      expect(matchesCompleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getNotableProbabilities", () => {
    it("only returns teams with probability > 1 % (except Canada)", async () => {
      const { teams } = await getNotableProbabilities();
      const nonCanadaLow = teams.filter((t) => t.code !== "CAN" && t.probability <= 1);
      expect(nonCanadaLow.length).toBe(0);
    });

    it("always includes Canada in notable teams", async () => {
      const { canada, teams } = await getNotableProbabilities();
      expect(canada).toBeDefined();
      expect(canada.code).toBe("CAN");
      const canadaInList = teams.find((t) => t.code === "CAN");
      expect(canadaInList).toBeDefined();
    });

    it("returns teams sorted by probability descending", async () => {
      const { teams } = await getNotableProbabilities();
      for (let i = 0; i < teams.length - 1; i++) {
        expect(teams[i].probability).toBeGreaterThanOrEqual(teams[i + 1].probability);
      }
    });

    it("returns more than 5 notable teams", async () => {
      const { teams } = await getNotableProbabilities();
      expect(teams.length).toBeGreaterThan(5);
    });

    it("only contains teams from Groups B, C, D or E (the Match 96 bracket groups)", async () => {
      const { teams } = await getNotableProbabilities();
      const validGroups = new Set(["B", "C", "D", "E"]);
      teams.forEach((t) => {
        expect(validGroups.has(t.group)).toBe(true);
      });
    });
  });

  describe("MATCH_96_BRACKET", () => {
    it("defines two bracket slots", () => {
      expect(MATCH_96_BRACKET.slot1).toBeDefined();
      expect(MATCH_96_BRACKET.slot2).toBeDefined();
    });

    it("slot1 involves 1st Group C vs 2nd Group B", () => {
      expect(MATCH_96_BRACKET.slot1.sideA).toEqual({ group: "C", position: 1 });
      expect(MATCH_96_BRACKET.slot1.sideB).toEqual({ group: "B", position: 2 });
    });

    it("slot2 involves 1st Group D vs 2nd Group E", () => {
      expect(MATCH_96_BRACKET.slot2.sideA).toEqual({ group: "D", position: 1 });
      expect(MATCH_96_BRACKET.slot2.sideB).toEqual({ group: "E", position: 2 });
    });
  });

  describe("buildTeamPaths", () => {
    it("returns an empty array for teams not on the Match 96 bracket path", () => {
      const argentina = { code: "ARG", group: "I", probability: 0 };
      expect(buildTeamPaths(argentina)).toEqual([]);

      const brazil = { code: "BRA", group: "H", probability: 0 };
      expect(buildTeamPaths(brazil)).toEqual([]);
    });

    it("returns paths for Canada (Group C - needs 1st place)", () => {
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(1);
        expect(p.groupFinishLabel).toContain("1st");
        expect(p.groupFinishLabel).toContain("Group C");
      });
    });

    it("returns paths for Mexico (Group B - needs 2nd place)", () => {
      const mexico = { code: "MEX", group: "B", probability: 10.0 };
      const paths = buildTeamPaths(mexico);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(2);
        expect(p.groupFinishLabel).toContain("2nd");
        expect(p.groupFinishLabel).toContain("Group B");
      });
    });

    it("returns paths for France (Group D - needs 1st place)", () => {
      const france = { code: "FRA", group: "D", probability: 12.5 };
      const paths = buildTeamPaths(france);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(1);
        expect(p.groupFinishLabel).toContain("Group D");
      });
    });

    it("returns paths for England (Group E - needs 2nd place)", () => {
      const england = { code: "ENG", group: "E", probability: 10.0 };
      const paths = buildTeamPaths(england);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(2);
        expect(p.groupFinishLabel).toContain("Group E");
      });
    });

    it("all scenario probabilities are equal (uniform model)", () => {
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      const first = paths[0].probability;
      paths.forEach((p) => {
        expect(p.probability).toBe(first);
      });
    });

    it("scenario probability equals (1/ownGroupSize) x (1/oppGroupSize) x 0.5 x 100 (expressed as %)", () => {
      // Canada: Group C has 4 teams, Group B (opponents) has 5 teams
      // P = 1/4 x 1/5 x 0.5 x 100 = 2.5 %
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(2.5, 5);
      });
    });

    it("Group D team scenarios each have probability 2.5% (4-team group vs 5-team group)", () => {
      const france = { code: "FRA", group: "D", probability: 12.5 };
      const paths = buildTeamPaths(france);
      // Group D (4 teams) x Group E (5 teams) x 0.5 x 100 = 2.5 %
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(2.5, 5);
      });
    });

    it("Group B team scenarios each have probability 2.5% (5-team group vs 4-team group)", () => {
      const colombia = { code: "COL", group: "B", probability: 10.0 };
      const paths = buildTeamPaths(colombia);
      // Group B (5 teams) x Group C (4 teams) x 0.5 x 100 = 2.5 %
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(2.5, 5);
      });
    });

    it("scenario probabilities sum to the team's total probability", () => {
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      const total = paths.reduce((sum, p) => sum + p.probability, 0);
      expect(total).toBeCloseTo(canada.probability, 1);
    });

    it("each path includes an r32Opponent with name, code and flag", () => {
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.r32Opponent).toBeDefined();
        expect(typeof p.r32Opponent.name).toBe("string");
        expect(typeof p.r32Opponent.code).toBe("string");
        expect(typeof p.r32Opponent.flag).toBe("string");
      });
    });

    it("number of scenarios equals the opposing group size", () => {
      // Group C (vs Group B which has 5 teams) -> 5 scenarios
      const canada = { code: "CAN", group: "C", probability: 12.5 };
      expect(buildTeamPaths(canada).length).toBe(5);

      // Group B (vs Group C which has 4 teams) -> 4 scenarios
      const colombia = { code: "COL", group: "B", probability: 10.0 };
      expect(buildTeamPaths(colombia).length).toBe(4);

      // Group D (vs Group E which has 5 teams) -> 5 scenarios
      const france = { code: "FRA", group: "D", probability: 12.5 };
      expect(buildTeamPaths(france).length).toBe(5);

      // Group E (vs Group D which has 4 teams) -> 4 scenarios
      const england = { code: "ENG", group: "E", probability: 10.0 };
      expect(buildTeamPaths(england).length).toBe(4);
    });
  });

  describe("getTournamentPaths", () => {
    it("only includes teams whose group leads to Match 96", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const validGroups = new Set(["B", "C", "D", "E"]);
      result.forEach(({ team }) => {
        expect(validGroups.has(team.group)).toBe(true);
      });
    });

    it("does not include teams from groups unrelated to Match 96", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const codes = result.map(({ team }) => team.code);
      expect(codes).not.toContain("ARG"); // Group I
      expect(codes).not.toContain("BRA"); // Group H
      expect(codes).not.toContain("ESP"); // Group F
    });

    it("includes Canada in the tournament paths", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const canada = result.find(({ team }) => team.code === "CAN");
      expect(canada).toBeDefined();
    });

    it("results are sorted by team probability descending", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].team.probability).toBeGreaterThanOrEqual(
          result[i + 1].team.probability
        );
      }
    });

    it("every team in the result has at least one path", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      result.forEach(({ paths }) => {
        expect(paths.length).toBeGreaterThan(0);
      });
    });
  });
});
