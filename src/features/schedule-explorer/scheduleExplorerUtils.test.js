import { describe, expect, it } from "vitest";
import schedule from "../../data/worldCup2026Schedule.json";
import { buildScheduleExplorerModel } from "./scheduleExplorerUtils.js";

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
    const match85 = canadaMatches.find((match) => match.matchNumber === 85);

    expect(match27?.opponentLabel).toBe("Qatar");
    expect(match85?.opponentLabel).toBe("3EFGIJ");
  });

  it("computes non-zero match probabilities and opponent scenarios for a country", () => {
    const model = buildScheduleExplorerModel(schedule);
    const canadaMatches = model.potentialMatchesByCountry.Canada;
    const match3 = canadaMatches.find((match) => match.matchNumber === 3);
    const match85 = canadaMatches.find((match) => match.matchNumber === 85);

    expect(match3?.probability).toBe(100);
    expect(match3?.opponentScenarios[0]).toEqual({
      slotNumber: 1,
      opponentCountry: "Bosnia and Herzegovina",
      probability: 100,
    });
    expect(match85?.probability).toBeGreaterThan(0);
    expect(match85?.probability).toBeCloseTo(25, 1);
    expect(match85?.opponentScenarios.length).toBeGreaterThan(0);
    expect(match85?.opponentScenarios[0].slotNumber).toBe(1);
    expect(match85?.opponentScenarios[0].opponentCountry).toBe("Curaçao");
    expect(match85?.opponentScenarios[0].probability).toBeCloseTo(6.667, 3);
  });

  it("builds host-country match views with slot-aware possible teams ordered by slot", () => {
    const model = buildScheduleExplorerModel(schedule);
    const canadaHostedMatch3 = model.matchesByHostCountry.Canada.find((match) => match.matchNumber === 3);
    const canadaHostedMatch85 = model.matchesByHostCountry.Canada.find((match) => match.matchNumber === 85);

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
    expect(canadaHostedMatch85).toBeDefined();
    expect(canadaHostedMatch85?.possibleTeams.length).toBeGreaterThan(0);
    expect(
      canadaHostedMatch85?.possibleTeams.some((team) => team.teamCountry === "Canada" && team.probability > 0)
    ).toBe(true);
  });
});
