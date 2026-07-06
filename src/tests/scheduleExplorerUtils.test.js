import { describe, expect, it } from "vitest";
import schedule from "../../public/data/worldCup2026Schedule.json";
import completedMatchResults from "../../public/data/completedMatchResults.json";
import { buildScheduleExplorerModel } from "../utils/scheduleExplorerUtils.js";

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

  it("propagates knockout probabilities using completed match results", () => {
    const model = buildScheduleExplorerModel(schedule, completedMatchResults.resultsByMatchNumber);
    const canadaMatches = model.potentialMatchesByCountry.Canada;
    const match90 = canadaMatches.find((match) => match.matchNumber === 90);
    const match97 = canadaMatches.find((match) => match.matchNumber === 97);
    const match104 = canadaMatches.find((match) => match.matchNumber === 104);

    expect(match90?.probability).toBe(100);
    expect(match97?.probability).toBe(50);
    expect(match104?.probability).toBe(12.5);
  });
});
