import { describe, expect, it } from "vitest";
import schedule from "../../../public/data/worldCup2026Schedule.json";
import completedMatchResults from "../../../public/data/completedMatchResults.json";
import { createKnockoutProbabilityEngine } from "./knockoutProbabilityEngine.js";

const buildEngine = (results = {}) => {
  const matches = schedule.filter((match) => Number.isInteger(match?.matchNumber));
  const matchMap = new Map(matches.map((match) => [match.matchNumber, match]));
  return createKnockoutProbabilityEngine({ matchMap, completedResults: results });
};

describe("createKnockoutProbabilityEngine", () => {
  it("assigns 100% participation to explicitly named Round of 32 teams", () => {
    const engine = buildEngine();
    const participation = engine.getMatchParticipation(73);

    expect(participation.get("Canada")).toBe(1);
    expect(participation.get("South Africa")).toBe(1);
  });

  it("propagates winner advancement with 50% per unresolved knockout match", () => {
    const engine = buildEngine();
    const participation = engine.getMatchParticipation(97);

    expect(participation.get("Canada")).toBeCloseTo(0.25, 5);
  });

  it("uses completed results instead of 50/50 splits", () => {
    const engine = buildEngine(completedMatchResults.resultsByMatchNumber);
    const roundOf16 = engine.getMatchParticipation(90);
    const quarterFinal = engine.getMatchParticipation(97);

    expect(roundOf16.get("Canada")).toBe(1);
    expect(roundOf16.get("South Africa")).toBeUndefined();
    expect(quarterFinal.get("Canada")).toBeCloseTo(0.5, 5);
  });

  it("assigns semi-final losers to the Bronze Final path", () => {
    const engine = buildEngine({
      84: { homeTeam: "Spain", awayTeam: "Austria", homeScore: 2, awayScore: 0 },
      93: { homeTeam: "Spain", awayTeam: "Croatia", homeScore: 1, awayScore: 0 },
      98: { homeTeam: "Spain", awayTeam: "Senegal", homeScore: 3, awayScore: 1 },
      101: { homeTeam: "Brazil", awayTeam: "Spain", homeScore: 2, awayScore: 1 },
    });
    const bronzeFinal = engine.getMatchParticipation(103);

    expect(bronzeFinal.get("Spain")).toBe(1);
    expect(bronzeFinal.get("Brazil")).toBeCloseTo(0.0625, 5);
  });

  it("assigns equal Final and Bronze probabilities from unresolved semi-finals", () => {
    const engine = buildEngine();
    const finalMatch = engine.getMatchParticipation(104);
    const bronzeFinal = engine.getMatchParticipation(103);

    expect(finalMatch.get("Brazil")).toBeCloseTo(0.0625, 5);
    expect(bronzeFinal.get("Brazil")).toBeCloseTo(0.0625, 5);
  });

  it("returns zero downstream probabilities for knockout losers", () => {
    const engine = buildEngine(completedMatchResults.resultsByMatchNumber);
    const quarterFinal = engine.getMatchParticipation(97);

    expect(quarterFinal.get("South Africa")).toBeUndefined();
  });
});
