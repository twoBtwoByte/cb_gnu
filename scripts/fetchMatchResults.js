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

// Tournament structure constants
const GROUP_STAGE_MATCHES = 88; // Total matches in group stage
const KNOCKOUT_GAP_THRESHOLD = 10; // Gaps >10 indicate missing knockout round data

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["cape verde islands", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia herzegovina", "bosnia and herzegovina"],
  ["turkey", "turkiye"], // API uses legacy English name; schedule uses official name "Türkiye" → slug "turkiye"
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

  // First pass: map all API matches by team names (ignoring schedule for now)
  const apiMatchesByTeams = new Map();
  apiMatches.forEach((apiMatch) => {
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
      return;
    }

    const key = [toCanonicalCountrySlug(homeTeam), toCanonicalCountrySlug(awayTeam)]
      .sort()
      .join("|");
    apiMatchesByTeams.set(key, { homeTeam, awayTeam, homeScore, awayScore });
  });

  // Build a map to resolve "Winner match XX" to actual team names
  // Use both existing results AND new API matches
  const winnerLookup = new Map();
  
  // Add winners from existing results
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

  // Add winners from new API matches (we'll determine their match numbers later)
  // This requires iterative resolution

  // Iteratively build the lookup table
  // Multiple passes may be needed to resolve nested knockout matches
  // (Round of 16 → Quarter-finals → Semi-finals → Final = 4 stages max)
  // Using 5 iterations (4 stages + 1 buffer) provides adequate headroom
  let resolved = true;
  let iterations = 0;
  const maxIterations = 5;
  
  while (resolved && iterations < maxIterations) {
    resolved = false;
    iterations++;

    scheduleData.forEach((match) => {
      const [slot1 = "", slot2 = ""] = getMatchLabels(match);
      const slug1 = toCanonicalCountrySlug(slot1);
      const slug2 = toCanonicalCountrySlug(slot2);

      // Resolve "winner match XX" to actual team if available
      const resolvedSlug1 = winnerLookup.get(slug1) ?? slug1;
      const resolvedSlug2 = winnerLookup.get(slug2) ?? slug2;

      // If both teams are resolved, check if we can find this match in API results
      if (
        resolvedSlug1 &&
        resolvedSlug2 &&
        !resolvedSlug1.startsWith("winner match") &&
        !resolvedSlug2.startsWith("winner match")
      ) {
        const key = [resolvedSlug1, resolvedSlug2].sort().join("|");
        const apiMatch = apiMatchesByTeams.get(key);
        
        if (apiMatch) {
          // Determine the winner and add to lookup
          const homeSlug = toCanonicalCountrySlug(apiMatch.homeTeam);
          const awaySlug = toCanonicalCountrySlug(apiMatch.awayTeam);
          const winner =
            apiMatch.homeScore > apiMatch.awayScore
              ? homeSlug
              : apiMatch.awayScore > apiMatch.homeScore
              ? awaySlug
              : null;
          
          const lookupKey = `winner match ${match.matchNumber}`;
          if (winner && !winnerLookup.has(lookupKey)) {
            winnerLookup.set(lookupKey, winner);
            resolved = true; // Continue iterating
          }
        }
      }
    });
  }

  // Final pass: map API matches to match numbers
  const results = {};
  const mappedApiKeys = new Set();

  scheduleData.forEach((match) => {
    const [slot1 = "", slot2 = ""] = getMatchLabels(match);
    const slug1 = toCanonicalCountrySlug(slot1);
    const slug2 = toCanonicalCountrySlug(slot2);

    // Resolve "winner match XX" to actual team if available
    const resolvedSlug1 = winnerLookup.get(slug1) ?? slug1;
    const resolvedSlug2 = winnerLookup.get(slug2) ?? slug2;

    // Only try to match if both teams are resolved
    if (
      resolvedSlug1 &&
      resolvedSlug2 &&
      !resolvedSlug1.startsWith("winner match") &&
      !resolvedSlug2.startsWith("winner match")
    ) {
      const key = [resolvedSlug1, resolvedSlug2].sort().join("|");
      const apiMatch = apiMatchesByTeams.get(key);
      
      if (apiMatch) {
        results[match.matchNumber] = apiMatch;
        mappedApiKeys.add(key);
      }
    }
  });

  // Collect all schedule team slugs (both resolved and raw) for name-matching diagnostics
  const allScheduleSlugs = new Set();
  scheduleData.forEach((match) => {
    const [slot1 = "", slot2 = ""] = getMatchLabels(match);
    allScheduleSlugs.add(toCanonicalCountrySlug(slot1));
    allScheduleSlugs.add(toCanonicalCountrySlug(slot2));
  });

  // Identify unmapped API matches and build diagnostics
  const unmappedApiMatches = [];
  apiMatchesByTeams.forEach((apiMatch, key) => {
    if (!mappedApiKeys.has(key)) {
      const homeSlug = toCanonicalCountrySlug(apiMatch.homeTeam);
      const awaySlug = toCanonicalCountrySlug(apiMatch.awayTeam);

      let reason;
      if (!allScheduleSlugs.has(homeSlug) && !allScheduleSlugs.has(awaySlug)) {
        reason = `neither "${apiMatch.homeTeam}" nor "${apiMatch.awayTeam}" appear in the schedule`;
      } else if (!allScheduleSlugs.has(homeSlug)) {
        reason = `"${apiMatch.homeTeam}" (slug: "${homeSlug}") not found in schedule — add an alias or check spelling`;
      } else if (!allScheduleSlugs.has(awaySlug)) {
        reason = `"${apiMatch.awayTeam}" (slug: "${awaySlug}") not found in schedule — add an alias or check spelling`;
      } else {
        reason = `both teams are in the schedule but this exact pairing wasn't resolved (knockout slot may still reference "Winner match X")`;
      }

      unmappedApiMatches.push({ apiMatch, reason });
    }
  });

  return { results, unmappedApiMatches };
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

  const { results: newResults, unmappedApiMatches } = mapCompletedMatchesByNumber(schedule, apiMatches, existingResults);

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

  // Check for unexpected gaps in knockout stage (matches after group stage)
  const sortedNumbers = Object.keys(sortedResults).map(Number);
  for (let i = 1; i < sortedNumbers.length; i++) {
    const gap = sortedNumbers[i] - sortedNumbers[i - 1];
    if (gap > KNOCKOUT_GAP_THRESHOLD && sortedNumbers[i] > GROUP_STAGE_MATCHES) {
      console.warn(`WARNING: Large gap in match numbers: ${sortedNumbers[i - 1]} to ${sortedNumbers[i]}`);
    }
  }

  // Warn about unmapped API matches
  if (unmappedApiMatches.length > 0) {
    console.warn(`WARNING: ${unmappedApiMatches.length} API match(es) could not be mapped to schedule:`);
    unmappedApiMatches.forEach(({ apiMatch, reason }) => {
      console.warn(`  - ${apiMatch.homeTeam} ${apiMatch.homeScore}–${apiMatch.awayScore} ${apiMatch.awayTeam}: ${reason}`);
    });
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
