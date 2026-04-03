import { describe, it, expect } from "vitest";
import {
  getMatchProbabilities,
  getNotableProbabilities,
  MATCH_INFO,
  MATCH_CONFIGS,
  MATCH_96_BRACKET,
  KNOCKOUT_WIN_PROB,
  computeProbabilityForMatch,
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

    it("teams in groups A, C and H (not on any Match 96 bracket path) have probability 0%", async () => {
      const { teams } = await getMatchProbabilities();
      const noPathGroups = ["A", "C", "H"];
      const noPath = teams.filter((t) => noPathGroups.includes(t.group));
      expect(noPath.length).toBeGreaterThan(0);
      noPath.forEach((t) => {
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

    it("teams in groups A, C and H have probability 0% (not on any Match 96 bracket path)", async () => {
      const { teams } = await getMatchProbabilities();
      const offPathGroups = ["A", "C", "H"];
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

    it("only contains teams from groups with a path to Match 96 (B, D, E, F, G, I, J, K, L)", async () => {
      const { teams } = await getNotableProbabilities();
      const validGroups = new Set(["B", "D", "E", "F", "G", "I", "J", "K", "L"]);
      teams.forEach((t) => {
        expect(validGroups.has(t.group)).toBe(true);
      });
    });
  });

  describe("MATCH_96_BRACKET", () => {
    it("defines two bracket slots", () => {
      expect(MATCH_96_BRACKET.sideA).toBeDefined();
      expect(MATCH_96_BRACKET.sideB).toBeDefined();
    });

    it("sideA involves 1st Group B vs best 3rd-place team from EFGIJ", () => {
      expect(MATCH_96_BRACKET.sideA.sideA).toEqual({ group: "B", position: 1 });
      expect(MATCH_96_BRACKET.sideA.sideB).toMatchObject({ thirdPlace: true, label: "3EFGIJ" });
    });

    it("sideB involves 1st Group K vs best 3rd-place team from DEIJL", () => {
      expect(MATCH_96_BRACKET.sideB.sideA).toEqual({ group: "K", position: 1 });
      expect(MATCH_96_BRACKET.sideB.sideB).toMatchObject({ thirdPlace: true, label: "3DEIJL" });
    });
  });

  describe("buildTeamPaths", () => {
    it("returns an empty array for teams not on the Match 96 bracket path", () => {
      const mexico = { code: "MEX", group: "A", probability: 0 };
      expect(buildTeamPaths(mexico)).toEqual([]);

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

    it("returns 1 path for USA (Group D - can qualify via 3rd place for R32 M87)", () => {
      const usa = { code: "USA", group: "D", probability: 2.5 };
      const paths = buildTeamPaths(usa);
      expect(paths.length).toBe(1);
      expect(paths[0].requiredPosition).toBe(3);
      expect(paths[0].r32Label).toBe("R32 Match 87");
      expect(paths[0].groupFinishLabel).toContain("3rd");
      expect(paths[0].groupFinishLabel).toContain("Group D");
    });

    it("returns 1 path for Germany (Group E - only R32 M87; M85 path excluded as Germany would play Canada in M85)", () => {
      const germany = { code: "GER", group: "E", probability: 2.5 };
      const paths = buildTeamPaths(germany);
      expect(paths.length).toBe(1);
      expect(paths[0].requiredPosition).toBe(3);
      expect(paths[0].groupFinishLabel).toContain("3rd");
      expect(paths[0].groupFinishLabel).toContain("Group E");
      expect(paths[0].r32Label).toBe("R32 Match 87");
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
      const validGroups = new Set(["B", "D", "E", "F", "G", "I", "J", "K", "L"]);
      result.forEach(({ team }) => {
        expect(validGroups.has(team.group)).toBe(true);
      });
    });

    it("does not include teams from groups unrelated to Match 96", async () => {
      const { teams } = await getMatchProbabilities();
      const result = getTournamentPaths(teams);
      const codes = result.map(({ team }) => team.code);
      expect(codes).not.toContain("ESP"); // Group H – no path to Match 96
      expect(codes).not.toContain("BRA"); // Group C – no path to Match 96
      expect(codes).not.toContain("MEX"); // Group A – no path to Match 96
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

  describe("MATCH_CONFIGS", () => {
    it("contains an entry for Match 96", () => {
      expect(MATCH_CONFIGS[96]).toBeDefined();
      expect(MATCH_CONFIGS[96].matchNumber).toBe(96);
    });

    it("MATCH_INFO is an alias for MATCH_CONFIGS[96]", () => {
      expect(MATCH_INFO).toBe(MATCH_CONFIGS[96]);
    });

    it("MATCH_96_BRACKET is an alias for MATCH_CONFIGS[96].bracket", () => {
      expect(MATCH_96_BRACKET).toBe(MATCH_CONFIGS[96].bracket);
    });

    it("Match 96 bracket sideA feeds via R32 Match 85 (Group B 1st vs best 3rd E/F/G/I/J)", () => {
      const { sideA } = MATCH_CONFIGS[96].bracket;
      expect(sideA.r32Label).toBe("R32 Match 85");
      expect(sideA.sideA).toEqual({ group: "B", position: 1 });
      expect(sideA.sideB.eligibleGroups).toEqual(["E", "F", "G", "I", "J"]);
    });

    it("Match 96 bracket sideB feeds via R32 Match 87 (Group K 1st vs best 3rd D/E/I/J/L)", () => {
      const { sideB } = MATCH_CONFIGS[96].bracket;
      expect(sideB.r32Label).toBe("R32 Match 87");
      expect(sideB.sideA).toEqual({ group: "K", position: 1 });
      expect(sideB.sideB.eligibleGroups).toEqual(["D", "E", "I", "J", "L"]);
    });
  });

  describe("computeProbabilityForMatch", () => {
    it("Group B team has probability 12.5% (1st-place path via R32 M85)", () => {
      const canada = { group: "B" };
      expect(computeProbabilityForMatch(canada, MATCH_96_BRACKET)).toBeCloseTo(12.5, 5);
    });

    it("Group K team has probability 12.5% (1st-place path via R32 M87)", () => {
      const portugal = { group: "K" };
      expect(computeProbabilityForMatch(portugal, MATCH_96_BRACKET)).toBeCloseTo(12.5, 5);
    });

    it("Group D team has probability 2.5% (3rd-place path via R32 M87 only)", () => {
      const usa = { group: "D" };
      expect(computeProbabilityForMatch(usa, MATCH_96_BRACKET)).toBeCloseTo(2.5, 5);
    });

    it("Group F team has probability 0% (R32 M85 path excluded: F teams would play Canada in M85, not M96)", () => {
      const netherlands = { group: "F" };
      expect(computeProbabilityForMatch(netherlands, MATCH_96_BRACKET)).toBeCloseTo(0, 5);
    });

    it("Group G team has probability 0% (R32 M85 path excluded: G teams would play Canada in M85, not M96)", () => {
      const belgium = { group: "G" };
      expect(computeProbabilityForMatch(belgium, MATCH_96_BRACKET)).toBeCloseTo(0, 5);
    });

    it("Group L team has probability 2.5% (3rd-place path via R32 M87 only)", () => {
      const england = { group: "L" };
      expect(computeProbabilityForMatch(england, MATCH_96_BRACKET)).toBeCloseTo(2.5, 5);
    });

    it("Group E team has probability 2.5% (only R32 M87 path; M85 path excluded as E teams play Canada in M85)", () => {
      const germany = { group: "E" };
      expect(computeProbabilityForMatch(germany, MATCH_96_BRACKET)).toBeCloseTo(2.5, 5);
    });

    it("Group I team has probability 2.5% (only R32 M87 path; M85 path excluded as I teams play Canada in M85)", () => {
      const france = { group: "I" };
      expect(computeProbabilityForMatch(france, MATCH_96_BRACKET)).toBeCloseTo(2.5, 5);
    });

    it("Group J team has probability 2.5% (only R32 M87 path; M85 path excluded as J teams play Canada in M85)", () => {
      const argentina = { group: "J" };
      expect(computeProbabilityForMatch(argentina, MATCH_96_BRACKET)).toBeCloseTo(2.5, 5);
    });

    it("Groups A, C and H have probability 0% (no path to Match 96)", () => {
      [{ group: "A" }, { group: "C" }, { group: "H" }].forEach((team) => {
        expect(computeProbabilityForMatch(team, MATCH_96_BRACKET)).toBe(0);
      });
    });
  });

  describe("3rd-place bracket paths", () => {
    it("groups D, E, I, J and L have non-zero probability; groups F and G have 0% (M85 path excluded)", async () => {
      const { teams } = await getMatchProbabilities();
      const nonZeroGroups = ["D", "E", "I", "J", "L"];
      nonZeroGroups.forEach((g) => {
        const groupTeams = teams.filter((t) => t.group === g);
        expect(groupTeams.length).toBeGreaterThan(0);
        groupTeams.forEach((t) => {
          expect(t.probability).toBeGreaterThan(0);
        });
      });
      // Groups F and G can only reach M96 via the R32 M85 host-team slot, which is
      // excluded because those teams would play Canada in M85, not in M96.
      const zeroGroups = ["F", "G"];
      zeroGroups.forEach((g) => {
        const groupTeams = teams.filter((t) => t.group === g);
        expect(groupTeams.length).toBeGreaterThan(0);
        groupTeams.forEach((t) => {
          expect(t.probability).toBe(0);
        });
      });
    });

    it("groups E, I, J have the same probability as D and L (all 2.5%, M87 only); F and G have 0% (M85-only, excluded)", async () => {
      const { teams } = await getMatchProbabilities();
      const groupE = teams.find((t) => t.group === "E");
      const groupD = teams.find((t) => t.group === "D");
      const groupF = teams.find((t) => t.group === "F");
      // E, I, J previously had 5% (two paths), now 2.5% (M85 path excluded)
      expect(groupE.probability).toBeCloseTo(groupD.probability, 5);
      // F and G only had the M85 path which is now excluded → 0%
      expect(groupF.probability).toBe(0);
    });

    it("3rd-place path r32Opponents reference the correct opposing group", () => {
      // Group D can only feed sideB (R32 M87) → opponent is 1st Group K
      const usa = { code: "USA", group: "D", probability: 2.5 };
      const paths = buildTeamPaths(usa);
      expect(paths.length).toBe(1);
      expect(paths[0].r32Opponent.name).toContain("Group K");

      // Group F's only path (R32 M85) is excluded because F teams would play
      // Canada in M85, so Group F has no valid paths to playing Canada in M96.
      const netherlands = { code: "NED", group: "F", probability: 0 };
      const fPaths = buildTeamPaths(netherlands);
      expect(fPaths.length).toBe(0);
    });

    it("3rd-place scenario probabilities for each path sum to the team's total probability", () => {
      const argentina = { code: "ARG", group: "J", probability: 2.5 };
      const paths = buildTeamPaths(argentina);
      const total = paths.reduce((sum, p) => sum + p.probability, 0);
      expect(total).toBeCloseTo(argentina.probability, 1);
    });
  });

  describe("match selector support (bracket parameterisation)", () => {
    it("getMatchProbabilities accepts a custom bracket and computes correct probabilities", async () => {
      const { teams } = await getMatchProbabilities(MATCH_96_BRACKET);
      const canada = teams.find((t) => t.code === "CAN");
      expect(canada.probability).toBeCloseTo(12.5, 5);
    });

    it("getTournamentPaths accepts a custom bracket and filters teams accordingly", async () => {
      const { teams } = await getMatchProbabilities(MATCH_96_BRACKET);
      const result = getTournamentPaths(teams, MATCH_96_BRACKET);
      result.forEach(({ paths }) => {
        expect(paths.length).toBeGreaterThan(0);
      });
    });

    it("buildTeamPaths respects a custom bracket parameter", () => {
      // With the default Match 96 bracket, Group E has 1 path (M87 only; M85 excluded)
      const germany = { code: "GER", group: "E" };
      expect(buildTeamPaths(germany, MATCH_96_BRACKET).length).toBe(1);
    });
  });
});
