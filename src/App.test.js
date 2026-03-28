import { describe, it, expect } from "vitest";
import { getMatchProbabilities, getNotableProbabilities, MATCH_INFO } from "./services/worldCupService";

describe("worldCupService", () => {
  describe("MATCH_INFO", () => {
    it("should describe Match 96 at BC Place, Vancouver", () => {
      expect(MATCH_INFO.matchNumber).toBe(96);
      expect(MATCH_INFO.venue).toBe("BC Place");
      expect(MATCH_INFO.city).toBe("Vancouver");
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
  });
});
