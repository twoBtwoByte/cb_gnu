import { describe, expect, it } from "vitest";
import schedule from "../../public/data/worldCup2026Schedule.json";
import { buildScheduleExplorerModel } from "../utils/scheduleExplorerUtils.js";
import {
  canadaAdvancementScenario,
  canadaQuarterFinalScenario,
  canadaSemiFinalScenario,
  earlyEliminationScenario,
  complexProbabilityScenario,
  drawScenario,
  usaAdvancementScenario,
} from "./fixtures/mockCompletedMatchResults.js";

describe("buildScheduleExplorerModel", () => {
  it("builds unique country and venue options from schedule data", () => {
    const model = buildScheduleExplorerModel(schedule);
    const uniqueCountries = new Set(model.countries);

    expect(model.countries).toContain("Mexico");
    expect(model.countries).toContain("Canada");
    expect(uniqueCountries.size).toBe(model.countries.length);
    expect(model.venues).toContain("Toronto Stadium");
  });

  it("maps knockout references so countries get full potential match paths", () => {
    const model = buildScheduleExplorerModel(schedule);
    expect(model.potentialMatchesByCountry.Mexico).toBeDefined();
    const mexicoMatchNumbers = model.potentialMatchesByCountry.Mexico.map((match) => match.matchNumber);

    expect(mexicoMatchNumbers).toContain(1);
    expect(mexicoMatchNumbers).toContain(79);
    expect(mexicoMatchNumbers).toContain(104);
    expect(mexicoMatchNumbers).not.toContain(85);
  });

  it("provides reciprocal country and venue filtering maps", () => {
    const model = buildScheduleExplorerModel(schedule);

    expect(model.venuesByCountry.Canada.has("Toronto Stadium")).toBe(true);
    expect(model.countriesByVenue["Toronto Stadium"].has("Canada")).toBe(true);
    expect(model.countriesByVenue["Toronto Stadium"].has("Mexico")).toBe(false);
  });

  it("adds opponent labels for potential match cards", () => {
    const model = buildScheduleExplorerModel(schedule);
    const canadaMatches = model.potentialMatchesByCountry.Canada;
    const match27 = canadaMatches.find((match) => match.matchNumber === 27);
    const match73 = canadaMatches.find((match) => match.matchNumber === 73);

    expect(match27?.opponentLabel).toBe("Qatar");
    expect(match73?.opponentLabel).toBe("South Africa");
  });

  it("computes non-zero match probabilities and opponent scenarios for a country", () => {
    const model = buildScheduleExplorerModel(schedule);
    const canadaMatches = model.potentialMatchesByCountry.Canada;
    const match3 = canadaMatches.find((match) => match.matchNumber === 3);
    const match73 = canadaMatches.find((match) => match.matchNumber === 73);

    expect(match3?.probability).toBe(100);
    expect(match3?.opponentScenarios[0]).toEqual({
      slotNumber: 1,
      opponentCountry: "Bosnia and Herzegovina",
      probability: 100,
    });
    expect(match73?.probability).toBe(100);
    expect(match73?.opponentScenarios).toEqual([
      {
        slotNumber: 2,
        opponentCountry: "South Africa",
        probability: 100,
      },
    ]);
  });

  it("builds host-country match views with slot-aware possible teams ordered by slot", () => {
    const model = buildScheduleExplorerModel(schedule);
    const canadaHostedMatch3 = model.matchesByHostCountry.Canada.find((match) => match.matchNumber === 3);

    expect(model.hostCountries).toContain("Canada");
    expect(canadaHostedMatch3?.possibleTeams).toEqual([
      expect.objectContaining({
        teamCountry: "Canada",
        probability: 100,
        slotNumbers: [1],
        primarySlotNumber: 1,
      }),
      expect.objectContaining({
        teamCountry: "Bosnia and Herzegovina",
        probability: 100,
        slotNumbers: [2],
        primarySlotNumber: 2,
      }),
    ]);
  });

  it("excludes knockout-confirmed teams from alternate group-stage knockout paths", () => {
    const model = buildScheduleExplorerModel(schedule);
    const mexicoMatches = model.potentialMatchesByCountry.Mexico;
    const match79 = mexicoMatches.find((match) => match.matchNumber === 79);
    const match82 = mexicoMatches.find((match) => match.matchNumber === 82);

    expect(match79?.probability).toBe(100);
    expect(match82).toBeUndefined();
  });

  it("keeps eliminated teams in group-stage matches but excludes them from knockout matches", () => {
    const model = buildScheduleExplorerModel(schedule);
    const qatarMatches = model.potentialMatchesByCountry.Qatar;
    const qatarMatchNumbers = qatarMatches.map((match) => match.matchNumber);

    expect(qatarMatchNumbers).toEqual(expect.arrayContaining([8, 27, 52]));
    expect(qatarMatches.every((match) => match.stage === "Group Stage")).toBe(true);
    expect(model.matchesByHostCountry.USA.find((match) => match.matchNumber === 81)?.possibleTeams).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ teamCountry: "Qatar" })])
    );
  });

  describe("knockout probability propagation with isolated test data", () => {
    it("propagates 100% probability when team wins Round of 32 match", () => {
      const model = buildScheduleExplorerModel(schedule, canadaAdvancementScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match90 = canadaMatches.find((match) => match.matchNumber === 90);

      // Canada won match 73, so should have 100% probability for Round of 16 match 90
      expect(match90?.probability).toBe(100);
      expect(match90?.stage).toBe("Round of 16");
    });

    it("propagates 100% probability when team wins Round of 16 and advances to QF", () => {
      const model = buildScheduleExplorerModel(schedule, canadaAdvancementScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match97 = canadaMatches.find((match) => match.matchNumber === 97);

      // Canada won match 90 (Round of 16), so Canada is confirmed for Quarter-final match 97
      // Even if opponent is not yet determined, Canada has 100% probability to be in this match
      expect(match97?.probability).toBe(100);
      expect(match97?.stage).toBe("Quarter-final");
    });

    it("propagates 100% probability when both QF opponents are confirmed", () => {
      const model = buildScheduleExplorerModel(schedule, canadaQuarterFinalScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match97 = canadaMatches.find((match) => match.matchNumber === 97);

      // Both Canada and France won their R16 matches, so both are confirmed for QF match 97
      expect(match97?.probability).toBe(100);
      expect(match97?.stage).toBe("Quarter-final");
    });

    it("propagates 100% probability to semi-final when QF is won", () => {
      const model = buildScheduleExplorerModel(schedule, canadaQuarterFinalScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match101 = canadaMatches.find((match) => match.matchNumber === 101);

      // Canada won match 97 (QF), so has 100% probability to be in SF match 101
      expect(match101?.probability).toBe(100);
      expect(match101?.stage).toBe("Semi-final");
    });

    it("propagates 100% probability to final when semi-final is won", () => {
      const model = buildScheduleExplorerModel(schedule, canadaSemiFinalScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match104 = canadaMatches.find((match) => match.matchNumber === 104);

      // Canada won SF match 101, so has 100% probability to be in Final match 104
      expect(match104?.probability).toBe(100);
      expect(match104?.stage).toBe("Final");
    });

    it("excludes team from knockout matches when eliminated in Round of 32", () => {
      const model = buildScheduleExplorerModel(schedule, earlyEliminationScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match90 = canadaMatches.find((match) => match.matchNumber === 90);

      // Canada lost match 73, so should not appear in match 90
      expect(match90).toBeUndefined();
    });

    it("handles draws as unresolved matches - maintains knockout advancement probability", () => {
      const model = buildScheduleExplorerModel(schedule, drawScenario);
      const mexicoMatches = model.potentialMatchesByCountry.Mexico;
      const match79 = mexicoMatches.find((match) => match.matchNumber === 79);

      // Match 1 was a draw, so Mexico should still have probability for match 79
      // Group stage draws don't eliminate teams from knockout rounds
      expect(match79?.probability).toBeGreaterThan(0);
    });

    it("propagates winner through multiple knockout rounds correctly", () => {
      const model = buildScheduleExplorerModel(schedule, usaAdvancementScenario);
      const usaMatches = model.potentialMatchesByCountry.USA;
      const match81 = usaMatches.find((match) => match.matchNumber === 81);
      const match94 = usaMatches.find((match) => match.matchNumber === 94);

      // USA won match 81 (Round of 32), should have 100% for that match
      expect(match81?.probability).toBe(100);
      // USA won match 94 (Round of 16), should have 100% for that match  
      expect(match94?.probability).toBe(100);
    });

    it("calculates Round of 16 probabilities correctly after Round of 32 wins", () => {
      const model = buildScheduleExplorerModel(schedule, complexProbabilityScenario);
      const englandMatches = model.potentialMatchesByCountry.England;
      const match92 = englandMatches.find((match) => match.matchNumber === 92);

      // England won match 80 (R32), so should have 100% probability for match 92 (R16)
      expect(match92?.probability).toBe(100);
    });

    it("excludes losing teams from subsequent knockout rounds", () => {
      const model = buildScheduleExplorerModel(schedule, complexProbabilityScenario);
      const mexicoMatches = model.potentialMatchesByCountry.Mexico;
      
      // Mexico lost match 92 (Round of 16) to England
      // Mexico should not appear in any Quarter-finals or later
      const quarterFinalMatches = mexicoMatches.filter((match) => 
        match.matchNumber >= 97 && match.matchNumber <= 100
      );
      expect(quarterFinalMatches.length).toBe(0);
    });

    it("maintains consistent probabilities across opponent scenarios", () => {
      const model = buildScheduleExplorerModel(schedule, canadaQuarterFinalScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      const match97 = canadaMatches.find((match) => match.matchNumber === 97);

      // Sum of opponent scenario probabilities should equal match probability
      const totalOpponentProbability = match97?.opponentScenarios?.reduce(
        (sum, scenario) => sum + scenario.probability,
        0
      );
      expect(totalOpponentProbability).toBe(match97?.probability);
    });

    it("handles teams eliminated from knockout stage but still shows group stage matches", () => {
      const model = buildScheduleExplorerModel(schedule, earlyEliminationScenario);
      const canadaMatches = model.potentialMatchesByCountry.Canada;
      
      // Canada should still have group stage matches even if eliminated from knockout
      const groupMatches = canadaMatches.filter((match) => match.stage === "Group Stage");
      expect(groupMatches.length).toBeGreaterThan(0);
      
      // But no knockout matches after elimination (Round of 32 match 73 is still there but later ones are not)
      const knockoutMatchesAfterElimination = canadaMatches.filter(
        (match) => match.stage !== "Group Stage" && match.matchNumber > 73
      );
      expect(knockoutMatchesAfterElimination.length).toBe(0);
    });
  });
});
