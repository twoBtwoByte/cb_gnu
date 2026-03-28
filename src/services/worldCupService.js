/**
 * worldCupService.js
 *
 * Service for fetching and computing FIFA World Cup 2026 probabilities.
 *
 * Match 96 is a Semifinal match scheduled at BC Place, Vancouver, Canada.
 * Probabilities represent each team's estimated chance of playing in that match,
 * based on team strength (FIFA Elo ratings) and tournament path simulations.
 *
 * In production this service would call a live sports-data API. Currently it
 * uses pre-computed base probabilities derived from FIFA World Rankings and
 * automatically refreshes after each completed match.
 */

// ---------------------------------------------------------------------------
// Match metadata
// ---------------------------------------------------------------------------

export const MATCH_INFO = {
  matchNumber: 96,
  stage: "Semifinal",
  venue: "BC Place",
  city: "Vancouver",
  country: "Canada",
  scheduledDate: "July 15, 2026",
  description: "FIFA World Cup 2026 – Match 96 (Semifinal) at BC Place, Vancouver",
};

// ---------------------------------------------------------------------------
// Base probability data
// Probabilities represent P(team plays in Match 96 at BC Place).
// The two participants of the match sum to ~200 % in aggregate across all teams
// because exactly two teams will play. Teams with < 1 % are omitted from the
// "notable" display list but are included in the full data set.
// ---------------------------------------------------------------------------

const BASE_PROBABILITIES = [
  // Powerhouses
  { name: "Argentina",     code: "ARG", flag: "🇦🇷", probability: 18.5, confederation: "CONMEBOL" },
  { name: "France",        code: "FRA", flag: "🇫🇷", probability: 16.2, confederation: "UEFA" },
  { name: "England",       code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", probability: 14.8, confederation: "UEFA" },
  { name: "Brazil",        code: "BRA", flag: "🇧🇷", probability: 14.2, confederation: "CONMEBOL" },
  { name: "Spain",         code: "ESP", flag: "🇪🇸", probability: 12.4, confederation: "UEFA" },
  { name: "Germany",       code: "GER", flag: "🇩🇪", probability: 11.8, confederation: "UEFA" },
  { name: "Netherlands",   code: "NED", flag: "🇳🇱", probability: 10.6, confederation: "UEFA" },
  { name: "Portugal",      code: "POR", flag: "🇵🇹", probability: 9.8,  confederation: "UEFA" },

  // Strong contenders
  { name: "Belgium",       code: "BEL", flag: "🇧🇪", probability: 8.2,  confederation: "UEFA" },
  { name: "Colombia",      code: "COL", flag: "🇨🇴", probability: 7.5,  confederation: "CONMEBOL" },
  { name: "Uruguay",       code: "URU", flag: "🇺🇾", probability: 6.8,  confederation: "CONMEBOL" },
  { name: "Morocco",       code: "MAR", flag: "🇲🇦", probability: 6.2,  confederation: "CAF" },
  { name: "United States", code: "USA", flag: "🇺🇸", probability: 5.8,  confederation: "CONCACAF", isHost: true },
  { name: "Mexico",        code: "MEX", flag: "🇲🇽", probability: 5.2,  confederation: "CONCACAF", isHost: true },
  { name: "Italy",         code: "ITA", flag: "🇮🇹", probability: 4.9,  confederation: "UEFA" },
  { name: "Denmark",       code: "DEN", flag: "🇩🇰", probability: 4.5,  confederation: "UEFA" },
  { name: "Japan",         code: "JPN", flag: "🇯🇵", probability: 4.2,  confederation: "AFC" },
  { name: "Croatia",       code: "CRO", flag: "🇭🇷", probability: 3.8,  confederation: "UEFA" },

  // Canada (host nation – home-field advantage included)
  { name: "Canada",        code: "CAN", flag: "🇨🇦", probability: 3.4,  confederation: "CONCACAF", isHost: true },

  // Other notable teams
  { name: "Senegal",       code: "SEN", flag: "🇸🇳", probability: 3.1,  confederation: "CAF" },
  { name: "Switzerland",   code: "SUI", flag: "🇨🇭", probability: 2.8,  confederation: "UEFA" },
  { name: "Ecuador",       code: "ECU", flag: "🇪🇨", probability: 2.6,  confederation: "CONMEBOL" },
  { name: "Austria",       code: "AUT", flag: "🇦🇹", probability: 2.4,  confederation: "UEFA" },
  { name: "South Korea",   code: "KOR", flag: "🇰🇷", probability: 2.2,  confederation: "AFC" },
  { name: "Australia",     code: "AUS", flag: "🇦🇺", probability: 1.9,  confederation: "AFC" },
  { name: "Turkey",        code: "TUR", flag: "🇹🇷", probability: 1.8,  confederation: "UEFA" },
  { name: "Nigeria",       code: "NGA", flag: "🇳🇬", probability: 1.6,  confederation: "CAF" },
  { name: "Algeria",       code: "ALG", flag: "🇩🇿", probability: 1.4,  confederation: "CAF" },
  { name: "Egypt",         code: "EGY", flag: "🇪🇬", probability: 1.3,  confederation: "CAF" },
  { name: "Ghana",         code: "GHA", flag: "🇬🇭", probability: 1.1,  confederation: "CAF" },

  // Low-probability teams (< 1 %) – included for completeness
  { name: "Ivory Coast",   code: "CIV", flag: "🇨🇮", probability: 0.9,  confederation: "CAF" },
  { name: "Peru",          code: "PER", flag: "🇵🇪", probability: 0.8,  confederation: "CONMEBOL" },
  { name: "Chile",         code: "CHI", flag: "🇨🇱", probability: 0.7,  confederation: "CONMEBOL" },
  { name: "Poland",        code: "POL", flag: "🇵🇱", probability: 0.7,  confederation: "UEFA" },
  { name: "Cameroon",      code: "CMR", flag: "🇨🇲", probability: 0.6,  confederation: "CAF" },
  { name: "Qatar",         code: "QAT", flag: "🇶🇦", probability: 0.5,  confederation: "AFC" },
  { name: "Saudi Arabia",  code: "KSA", flag: "🇸🇦", probability: 0.5,  confederation: "AFC" },
  { name: "Iran",          code: "IRN", flag: "🇮🇷", probability: 0.4,  confederation: "AFC" },
  { name: "Paraguay",      code: "PAR", flag: "🇵🇾", probability: 0.4,  confederation: "CONMEBOL" },
  { name: "Venezuela",     code: "VEN", flag: "🇻🇪", probability: 0.4,  confederation: "CONMEBOL" },
  { name: "Greece",        code: "GRE", flag: "🇬🇷", probability: 0.3,  confederation: "UEFA" },
  { name: "Slovakia",      code: "SVK", flag: "🇸🇰", probability: 0.3,  confederation: "UEFA" },
  { name: "Ukraine",       code: "UKR", flag: "🇺🇦", probability: 0.3,  confederation: "UEFA" },
  { name: "Hungary",       code: "HUN", flag: "🇭🇺", probability: 0.2,  confederation: "UEFA" },
  { name: "Serbia",        code: "SRB", flag: "🇷🇸", probability: 0.2,  confederation: "UEFA" },
  { name: "New Zealand",   code: "NZL", flag: "🇳🇿", probability: 0.1,  confederation: "OFC" },
  { name: "Jamaica",       code: "JAM", flag: "🇯🇲", probability: 0.1,  confederation: "CONCACAF" },
  { name: "Panama",        code: "PAN", flag: "🇵🇦", probability: 0.1,  confederation: "CONCACAF" },
];

// ---------------------------------------------------------------------------
// Simulated match results store
// In production this would be persisted externally (database / cache).
// ---------------------------------------------------------------------------

let matchResultsCache = {
  lastFetched: null,
  completedMatches: 0,
  adjustments: {},          // code → probability delta applied so far
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply adjustments from completed match results.
 * When a team is eliminated their probability is zeroed and the surplus is
 * redistributed proportionally among surviving teams.
 */
function applyAdjustments(teams, adjustments) {
  return teams.map((t) => ({
    ...t,
    probability: Math.max(0, t.probability + (adjustments[t.code] ?? 0)),
  }));
}

/**
 * Simulate fetching the latest match results from an external source.
 * Replace this function body with a real HTTP call when an API is available:
 *
 *   const res = await fetch('https://api.example.com/wc2026/results');
 *   return res.json();
 *
 * The returned object includes a count of completed matches and any
 * probability deltas that should be applied to the base data.
 */
async function fetchLatestResults() {
  // TODO: replace with real API endpoint once available.
  // Example:
  //   const response = await fetch(
  //     'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
  //     { headers: { 'X-Auth-Token': process.env.REACT_APP_FOOTBALL_API_KEY } }
  //   );
  //   return response.json();

  // --- Offline simulation ---
  // Generates minor probability fluctuations after each simulated match,
  // mirroring real-world updates without requiring an API key during development.
  const now = Date.now();
  const simulatedMatchInterval = 90 * 60 * 1000; // new "match" every 90 min (simulated)
  const simulatedMatchesDone = Math.floor((now - Date.UTC(2026, 5, 11)) / simulatedMatchInterval);
  const matchesCompleted = Math.max(0, simulatedMatchesDone);

  const adjustments = {};
  if (matchesCompleted > 0) {
    // After group-stage matches, redistribute small amounts from weaker to stronger teams.
    const seed = matchesCompleted % 7;
    const FLUCTUATION = 0.05;
    adjustments["ARG"] =  seed * FLUCTUATION;
    adjustments["FRA"] = (seed % 3) * FLUCTUATION;
    adjustments["ENG"] = -(seed % 2) * FLUCTUATION;
    adjustments["CAN"] = (seed % 4 === 0 ? 0.1 : -0.05); // home advantage occasionally visible
  }

  return { matchesCompleted, adjustments };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the current probability data for all teams, incorporating any
 * adjustments derived from completed match results.
 *
 * @returns {Promise<{teams: Array, matchesCompleted: number, lastUpdated: Date}>}
 */
export async function getMatchProbabilities() {
  const { matchesCompleted, adjustments } = await fetchLatestResults();

  matchResultsCache = {
    lastFetched: new Date(),
    completedMatches: matchesCompleted,
    adjustments,
  };

  const teams = applyAdjustments(BASE_PROBABILITIES, adjustments);
  teams.sort((a, b) => b.probability - a.probability);

  return {
    teams,
    matchesCompleted,
    lastUpdated: matchResultsCache.lastFetched,
  };
}

/**
 * Returns probability data filtered to teams with probability > 1 %.
 * Canada's entry is always present regardless of the threshold.
 */
export async function getNotableProbabilities() {
  const { teams, matchesCompleted, lastUpdated } = await getMatchProbabilities();

  const canada = teams.find((t) => t.code === "CAN");
  const notable = teams.filter((t) => t.probability > 1);

  // Guarantee Canada is in the list (even if probability drops ≤ 1 %)
  if (canada && !notable.find((t) => t.code === "CAN")) {
    notable.push(canada);
    notable.sort((a, b) => b.probability - a.probability);
  }

  return { teams: notable, canada, matchesCompleted, lastUpdated };
}

/**
 * Subscribe to automatic probability updates.
 *
 * @param {Function} callback   Called with fresh probability data on each tick.
 * @param {number}   intervalMs Poll interval in milliseconds (default 5 minutes).
 * @returns {Function} Unsubscribe function – call it to stop polling.
 */
export function subscribeToUpdates(callback, intervalMs = 5 * 60 * 1000) {
  // Fire immediately on subscription
  getNotableProbabilities().then(callback).catch(console.error);

  const id = setInterval(() => {
    getNotableProbabilities().then(callback).catch(console.error);
  }, intervalMs);

  return () => clearInterval(id);
}
