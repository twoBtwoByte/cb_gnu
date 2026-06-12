import { describe, expect, it } from "vitest";
import schedule from "../../data/worldCup2026Schedule.json";
import { buildScheduleExplorerModel } from "./scheduleExplorerUtils.js";

describe("buildScheduleExplorerModel", () => {
  it("builds unique country and venue options from schedule data", () => {
    const model = buildScheduleExplorerModel(schedule);

    expect(model.countries).toContain("Mexico");
    expect(model.countries).toContain("Canada");
    expect(model.countries.filter((country) => country === "Mexico")).toHaveLength(1);
    expect(model.venues).toContain("Toronto Stadium");
  });

  it("maps knockout references so countries get full potential match paths", () => {
    const model = buildScheduleExplorerModel(schedule);
    const mexicoMatchNumbers = (model.potentialMatchesByCountry.Mexico ?? []).map((match) => match.matchNumber);

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
});
