#!/usr/bin/env node
// scripts/fetchMatchResults.js
// Fetches completed World Cup match results from the football-data.org API and
// writes them to src/data/completedMatchResults.json so the app can load known
// results on startup without relying solely on the user's localStorage.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../src/data");

const schedule = JSON.parse(
  readFileSync(join(dataDir, "worldCup2026Schedule.json"), "utf8")
);

const API_BASE_URL =
  process.env.VITE_FOOTBALL_DATA_API_BASE_URL ?? "https://api.football-data.org/v4";
const COMPETITION_CODE =
  process.env.VITE_FOOTBALL_DATA_COMPETITION_CODE ?? "WC";
const API_TOKEN = process.env.VITE_FOOTBALL_DATA_API_TOKEN;

const apiUrl = `${API_BASE_URL}/competitions/${COMPETITION_CODE}/matches?status=FINISHED`;

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia herzegovina", "bosnia and herzegovina"],
]);

const toCanonicalCountrySlug = (value = "") => {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return COUNTRY_ALIASES.get(slug) ?? slug;
};

const getMatchLabels = (match) =>
  Object.values(match?.bracket ?? {})
    .map((slot) => (typeof slot?.label === "string" ? slot.label.trim() : ""))
    .filter(Boolean)
    .slice(0, 2);

const mapCompletedMatchesByNumber = (scheduleData, apiMatches) => {
  if (
    !Array.isArray(scheduleData) ||
    scheduleData.length === 0 ||
    !Array.isArray(apiMatches)
  ) {
    return {};
  }

  const matchLookup = new Map(
    scheduleData.map((match) => {
      const [slot1 = "", slot2 = ""] = getMatchLabels(match);
      const key = [toCanonicalCountrySlug(slot1), toCanonicalCountrySlug(slot2)]
        .sort()
        .join("|");
      return [key, match.matchNumber];
    })
  );

  return apiMatches.reduce((acc, apiMatch) => {
    const homeTeam = apiMatch?.homeTeam?.name ?? "";
    const awayTeam = apiMatch?.awayTeam?.name ?? "";
    const homeScore = apiMatch?.score?.fullTime?.home;
    const awayScore = apiMatch?.score?.fullTime?.away;

    if (
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      !homeTeam ||
      !awayTeam
    ) {
      return acc;
    }

    const key = [toCanonicalCountrySlug(homeTeam), toCanonicalCountrySlug(awayTeam)]
      .sort()
      .join("|");
    const matchNumber = matchLookup.get(key);
    if (!matchNumber) return acc;

    acc[matchNumber] = { homeTeam, awayTeam, homeScore, awayScore };
    return acc;
  }, {});
};

async function main() {
  const headers = {
    "Cache-Control": "no-cache",
    ...(API_TOKEN ? { "X-Auth-Token": API_TOKEN } : {}),
  };

  console.log(`Fetching completed matches from ${apiUrl} …`);
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const resultsByMatchNumber = mapCompletedMatchesByNumber(schedule, payload?.matches);

  const output = {
    requestedAt: new Date().toLocaleString('en-CA', { 
      timeZone: 'America/New_York', 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }),
    resultsByMatchNumber,
  };

  const outputPath = join(dataDir, "completedMatchResults.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

  const count = Object.keys(resultsByMatchNumber).length;
  console.log(
    `Wrote ${count} completed match result(s) to src/data/completedMatchResults.json`
  );
}

main().catch((error) => {
  console.error("Failed to fetch match results:", error);
  process.exit(1);
});
