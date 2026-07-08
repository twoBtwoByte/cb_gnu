#!/usr/bin/env node
// scripts/fetchMatchResults.js
// Fetches completed World Cup match results from the football-data.org API and
// writes them to src/data/completedMatchResults.json so the app can load known
// results on startup without relying solely on the user's localStorage.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../public/data");

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

const mapCompletedMatchesByNumber = (scheduleData, apiMatches, existingResults = {}) => {
  if (
    !Array.isArray(scheduleData) ||
    scheduleData.length === 0 ||
    !Array.isArray(apiMatches)
  ) {
    return {};
  }

  // Build a map to resolve "Winner match XX" to actual team names from existing results
  const winnerLookup = new Map();
  Object.entries(existingResults).forEach(([matchNum, result]) => {
    const homeSlug = toCanonicalCountrySlug(result.homeTeam);
    const awaySlug = toCanonicalCountrySlug(result.awayTeam);
    const winner =
      result.homeScore > result.awayScore
        ? homeSlug
        : result.awayScore > result.homeScore
        ? awaySlug
        : null;
    
    if (winner) {
      winnerLookup.set(`winner match ${matchNum}`, winner);
    }
  });

  // Build lookup table from schedule, resolving placeholders where possible
  const matchLookup = new Map();
  scheduleData.forEach((match) => {
    const [slot1 = "", slot2 = ""] = getMatchLabels(match);
    const slug1 = toCanonicalCountrySlug(slot1);
    const slug2 = toCanonicalCountrySlug(slot2);

    // Resolve "winner match XX" to actual team if available
    const resolvedSlug1 = winnerLookup.get(slug1) ?? slug1;
    const resolvedSlug2 = winnerLookup.get(slug2) ?? slug2;

    // Only create lookup if both teams are resolved (not placeholders)
    if (
      resolvedSlug1 &&
      resolvedSlug2 &&
      !resolvedSlug1.startsWith("winner match") &&
      !resolvedSlug2.startsWith("winner match")
    ) {
      const key = [resolvedSlug1, resolvedSlug2].sort().join("|");
      matchLookup.set(key, match.matchNumber);
    }
  });

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

  // Load existing results for merge and resolution
  const outputPath = join(dataDir, "completedMatchResults.json");
  let existingResults = {};
  try {
    const existing = JSON.parse(readFileSync(outputPath, "utf8"));
    existingResults = existing?.resultsByMatchNumber ?? {};
  } catch {
    // File doesn't exist or is invalid, start fresh
  }

  console.log(`Fetching completed matches from ${apiUrl} …`);
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const apiMatches = payload?.matches ?? [];
  console.log(`API returned ${apiMatches.length} completed match(es)`);
  console.log(`Existing results: ${Object.keys(existingResults).length}`);

  const newResults = mapCompletedMatchesByNumber(schedule, apiMatches, existingResults);

  // Merge: preserve existing, add new, update changed
  let addedCount = 0;
  let updatedCount = 0;
  const mergedResults = { ...existingResults };

  Object.entries(newResults).forEach(([matchNum, newResult]) => {
    const existing = mergedResults[matchNum];
    if (!existing) {
      mergedResults[matchNum] = newResult;
      addedCount++;
      console.log(`\nAdded result:`);
      console.log(`Match ${matchNum}`);
      console.log(`${newResult.homeTeam} ${newResult.homeScore}–${newResult.awayScore} ${newResult.awayTeam}`);
    } else if (
      existing.homeScore !== newResult.homeScore ||
      existing.awayScore !== newResult.awayScore
    ) {
      mergedResults[matchNum] = newResult;
      updatedCount++;
      console.log(`\nUpdated result:`);
      console.log(`Match ${matchNum}`);
      console.log(`Was: ${existing.homeTeam} ${existing.homeScore}–${existing.awayScore} ${existing.awayTeam}`);
      console.log(`Now: ${newResult.homeTeam} ${newResult.homeScore}–${newResult.awayScore} ${newResult.awayTeam}`);
    }
  });

  if (addedCount === 0 && updatedCount === 0) {
    console.log("\nNo new completed match results found.");
  }

  // Validation
  const matchNumbers = Object.keys(mergedResults).map(Number);
  const uniqueNumbers = new Set(matchNumbers);
  if (uniqueNumbers.size !== matchNumbers.length) {
    console.warn("WARNING: Duplicate match numbers detected!");
  }

  // Sort by match number
  const sortedResults = Object.fromEntries(
    Object.entries(mergedResults).sort(([a], [b]) => Number(a) - Number(b))
  );

  // Check for unexpected gaps in knockout stage
  const sortedNumbers = Object.keys(sortedResults).map(Number);
  for (let i = 1; i < sortedNumbers.length; i++) {
    const gap = sortedNumbers[i] - sortedNumbers[i - 1];
    if (gap > 10 && sortedNumbers[i] > 88) {
      console.warn(`WARNING: Large gap in match numbers: ${sortedNumbers[i - 1]} to ${sortedNumbers[i]}`);
    }
  }

  // Warn about unmapped API matches
  const mappedCount = Object.keys(newResults).length;
  if (mappedCount < apiMatches.length) {
    console.warn(`WARNING: ${apiMatches.length - mappedCount} API match(es) could not be mapped to schedule`);
  }

  const output = {
    requestedAt: new Date().toLocaleString('en-CA', { 
      timeZone: 'America/New_York', 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }),
    resultsByMatchNumber: sortedResults,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`\nExisting results: ${Object.keys(existingResults).length}`);
  console.log(`New results added: ${addedCount}`);
  console.log(`Updated results: ${updatedCount}`);
  console.log(`Final results written: ${Object.keys(sortedResults).length}`);
}

main().catch((error) => {
  console.error("Failed to fetch match results:", error);
  process.exit(1);
});
