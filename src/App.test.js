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
    it("every team in a 4-team group (B or K) on the Match 96 path has probability 12.5%", async () => {
      const { teams } = await getMatchProbabilities();
      const groupBTeams = teams.filter((t) => t.group === "B");
      const groupKTeams = teams.filter((t) => t.group === "K");
      expect(groupBTeams.length).toBeGreaterThan(0);
      expect(groupKTeams.length).toBeGreaterThan(0);
      [...groupBTeams, ...groupKTeams].forEach((t) => {
        expect(t.probability).toBeCloseTo(12.5, 5);
      });
    });

    it("teams in groups C, D and E (not on the direct Match 96 path) have probability 0%", async () => {
      const { teams } = await getMatchProbabilities();
      const offDirectGroups = ["C", "D", "E"];
      const offDirect = teams.filter((t) => offDirectGroups.includes(t.group));
      expect(offDirect.length).toBeGreaterThan(0);
      offDirect.forEach((t) => {
        expect(t.probability).toBe(0);
      });
    });

    it("all bracket-path groups (B and K) contain exactly 4 teams", async () => {
      const { teams } = await getMatchProbabilities();
      ["B", "K"].forEach((g) => {
        const count = teams.filter((t) => t.group === g).length;
        expect(count).toBe(4);
      });
    });

    it("teams not on the Match 96 path have probability 0%", async () => {
      const { teams } = await getMatchProbabilities();
      const offPathGroups = ["A", "C", "D", "E", "F", "G", "H", "I", "J", "L"];
      const offPath = teams.filter((t) => offPathGroups.includes(t.group));
      expect(offPath.length).toBeGreaterThan(0);
      offPath.forEach((t) => {
        expect(t.probability).toBe(0);
      });
    });

    it("Canada has the same probability as every other Group B team", async () => {
      const { teams } = await getMatchProbabilities();
      const canada = teams.find((t) => t.code === "CAN");
      const groupB = teams.filter((t) => t.group === "B");
      expect(canada).toBeDefined();
      groupB.forEach((t) => {
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

    it("only contains teams from Groups B or K (the Match 96 bracket groups)", async () => {
      const { teams } = await getNotableProbabilities();
      const validGroups = new Set(["B", "K"]);
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

    it("slot1 involves 1st Group B vs best 3rd-place team from EFGIJ", () => {
      expect(MATCH_96_BRACKET.slot1.sideA).toEqual({ group: "B", position: 1 });
      expect(MATCH_96_BRACKET.slot1.sideB).toMatchObject({ thirdPlace: true, label: "3EFGIJ" });
    });

    it("slot2 involves 1st Group K vs best 3rd-place team from DEIJL", () => {
      expect(MATCH_96_BRACKET.slot2.sideA).toEqual({ group: "K", position: 1 });
      expect(MATCH_96_BRACKET.slot2.sideB).toMatchObject({ thirdPlace: true, label: "3DEIJL" });
    });
  });

  describe("buildTeamPaths", () => {
    it("returns an empty array for teams not on the Match 96 bracket path", () => {
      const argentina = { code: "ARG", group: "J", probability: 0 };
      expect(buildTeamPaths(argentina)).toEqual([]);

      const spain = { code: "ESP", group: "H", probability: 0 };
      expect(buildTeamPaths(spain)).toEqual([]);
    });

    it("returns paths for Canada (Group B - needs 1st place)", () => {
      const canada = { code: "CAN", group: "B", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(1);
        expect(p.groupFinishLabel).toContain("1st");
        expect(p.groupFinishLabel).toContain("Group B");
      });
    });

    it("returns paths for Portugal (Group K - needs 1st place)", () => {
      const portugal = { code: "POR", group: "K", probability: 12.5 };
      const paths = buildTeamPaths(portugal);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.requiredPosition).toBe(1);
        expect(p.groupFinishLabel).toContain("1st");
        expect(p.groupFinishLabel).toContain("Group K");
      });
    });

    it("returns no paths for Brazil (Group C - not on direct path)", () => {
      const brazil = { code: "BRA", group: "C", probability: 0 };
      expect(buildTeamPaths(brazil)).toEqual([]);
    });

    it("returns no paths for USA (Group D - not on direct path)", () => {
      const usa = { code: "USA", group: "D", probability: 0 };
      expect(buildTeamPaths(usa)).toEqual([]);
    });

    it("returns no paths for Germany (Group E - not on direct path)", () => {
      const germany = { code: "GER", group: "E", probability: 0 };
      expect(buildTeamPaths(germany)).toEqual([]);
    });

    it("all scenario probabilities are equal (uniform model)", () => {
      const canada = { code: "CAN", group: "B", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      const first = paths[0].probability;
      paths.forEach((p) => {
        expect(p.probability).toBe(first);
      });
    });

    it("scenario probability for Group B equals (1/ownGroupSize) x 0.5 x 100 against 3rd-place qualifier", () => {
      // Canada: Group B has 4 teams, opponent is a single 3rd-place qualifier
      // P = 1/4 x 0.5 x 100 = 12.5%
      const canada = { code: "CAN", group: "B", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(12.5, 5);
      });
    });

    it("Group K team scenarios each have probability 12.5% (4-team group vs 3rd-place qualifier)", () => {
      const portugal = { code: "POR", group: "K", probability: 12.5 };
      const paths = buildTeamPaths(portugal);
      // Group K (4 teams) x single 3rd-place qualifier x 0.5 x 100 = 12.5%
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(12.5, 5);
      });
    });

    it("Group B team scenarios each have probability 12.5% (4-team group vs 3rd-place qualifier)", () => {
      const switzerland = { code: "SUI", group: "B", probability: 12.5 };
      const paths = buildTeamPaths(switzerland);
      // Group B (4 teams) x single 3rd-place qualifier x 0.5 x 100 = 12.5%
      paths.forEach((p) => {
        expect(p.probability).toBeCloseTo(12.5, 5);
      });
    });

    it("scenario probabilities sum to the team's total probability", () => {
      const portugal = { code: "POR", group: "K", probability: 12.5 };
      const paths = buildTeamPaths(portugal);
      const total = paths.reduce((sum, p) => sum + p.probability, 0);
      expect(total).toBeCloseTo(portugal.probability, 1);
    });
    it("each path includes an r32Opponent with name, code and flag", () => {
      const canada = { code: "CAN", group: "B", probability: 12.5 };
      const paths = buildTeamPaths(canada);
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.r32Opponent).toBeDefined();
        expect(typeof p.r32Opponent.name).toBe("string");
        expect(typeof p.r32Opponent.code).toBe("string");
        expect(typeof p.r32Opponent.flag).toBe("string");
      });
    });

    it("Group B and Group K teams each have exactly 1 scenario (single 3rd-place qualifier opponent)", () => {
      // Group B: 1 scenario – 3EFGIJ qualifier
      const canada = { code: "CAN", group: "B", probability: 12.5 };
      expect(buildTeamPaths(canada).length).toBe(1);

      // Group K: 1 scenario – 3DEIJL qualifier
      const portugal = { code: "POR", group: "K", probability: 12.5 };
      expect(buildTeamPaths(portugal).length).toBe(1);
    });
  });

  describe("getTournamentPaths", () => {
    it("only includes teams whose group leads to Match 96", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const validGroups = new Set(["B", "K"]);
      result.forEach(({ team }) => {
        expect(validGroups.has(team.group)).toBe(true);
      });
    });

    it("does not include teams from groups unrelated to Match 96", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const codes = result.map(({ team }) => team.code);
      expect(codes).not.toContain("ARG"); // Group J
      expect(codes).not.toContain("FRA"); // Group I
      expect(codes).not.toContain("ESP"); // Group H
      expect(codes).not.toContain("BRA"); // Group C (no longer on direct path)
      expect(codes).not.toContain("USA"); // Group D (no longer on direct path)
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
