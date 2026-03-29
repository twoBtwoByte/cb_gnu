/**
 * worldCupService.js
 *
 * Service for fetching and computing FIFA World Cup 2026 probabilities.
 *
 * Match 96 is a Round of 16 match scheduled at BC Place, Vancouver, Canada on
 * July 7, 2026. Probabilities are calculated using a uniform model:
 *
 *   – Group stage  : every team in a group has an equal 1/N chance of
 *                    finishing in any given position (25% each in a
 *                    4-team group, since all groups have 4 teams).
 *   – Knockout leg : each team in any individual match has a 50% chance
 *                    of advancing to the next round.
 *
 * In production this service would call a live sports-data API. Currently it
 * uses pre-computed base probabilities derived from the uniform model above
 * and automatically refreshes after each completed match.
 */

// ---------------------------------------------------------------------------
// Match metadata
// ---------------------------------------------------------------------------

export const MATCH_INFO = {
  matchNumber: 96,
  stage: "Round of 16",
  venue: "BC Place",
  city: "Vancouver",
  country: "Canada",
  scheduledDate: "July 7, 2026",
  description: "FIFA World Cup 2026 – Match 96 (Round of 16) at BC Place, Vancouver",
};

// ---------------------------------------------------------------------------
// Uniform probability model constants
//
// These are the two fundamental rules that drive every probability shown in
// the app:
//
//   KNOCKOUT_WIN_PROB  – in any single knockout match with no prior results,
//                        each team has a 50% chance of winning.
//
//   Group-finish prob  – every group has exactly 4 teams; with no matches
//                        played, each team has a 25% (1/4) chance of
//                        finishing in any given position.
//                        Computed as  1 / groupSize  at run-time.
// ---------------------------------------------------------------------------

/** Probability of either team winning a knockout match (no results yet). */
export const KNOCKOUT_WIN_PROB = 0.50;

// ---------------------------------------------------------------------------
// Base probability data
//
// Each team's probability of playing in Match 96 is derived solely from the
// uniform model:
//
//   P(play in Match 96)  =  (1 / own-group-size)  ×  KNOCKOUT_WIN_PROB
//
// Every group has exactly 4 teams, so for all bracket-path groups:
//   – Groups C & D (4 teams, 1st place required) : 1/4 × 0.5 = 12.5%
//   – Groups B & E (4 teams, 2nd place required) : 1/4 × 0.5 = 12.5%
//   – All other groups                           : 0.0%
// ---------------------------------------------------------------------------

const BASE_PROBABILITIES = [
  // Group A – not on Match 96 bracket path (probability = 0)
  { name: "Mexico",                            code: "MEX",   flag: "🇲🇽", probability: 0,    confederation: "CONCACAF", isHost: true, group: "A" },
  { name: "South Africa",                      code: "RSA",   flag: "🇿🇦", probability: 0,    confederation: "CAF",                   group: "A" },
  { name: "South Korea",                       code: "KOR",   flag: "🇰🇷", probability: 0,    confederation: "AFC",                   group: "A" },
  { name: "TBC (Denmark / Czech Republic)",    code: "TBC_A", flag: "🏳️",  probability: 0,    confederation: "UEFA",                  group: "A" },

  // Group B – 4 teams, 2nd place leads to Match 96: P = 1/4 × 0.5 = 12.5%
  { name: "Canada",                            code: "CAN",   flag: "🇨🇦", probability: 12.5, confederation: "CONCACAF", isHost: true, group: "B" },
  { name: "TBC (Italy / Bosnia & Herzegovina)", code: "TBC_B", flag: "🏳️", probability: 12.5, confederation: "UEFA",                  group: "B" },
  { name: "Qatar",                             code: "QAT",   flag: "🇶🇦", probability: 12.5, confederation: "AFC",                   group: "B" },
  { name: "Switzerland",                       code: "SUI",   flag: "🇨🇭", probability: 12.5, confederation: "UEFA",                  group: "B" },

  // Group C – 4 teams, 1st place leads to Match 96: P = 1/4 × 0.5 = 12.5%
  { name: "Brazil",                            code: "BRA",   flag: "🇧🇷", probability: 12.5, confederation: "CONMEBOL",              group: "C" },
  { name: "Morocco",                           code: "MAR",   flag: "🇲🇦", probability: 12.5, confederation: "CAF",                   group: "C" },
  { name: "Haiti",                             code: "HAI",   flag: "🇭🇹", probability: 12.5, confederation: "CONCACAF",              group: "C" },
  { name: "Scotland",                          code: "SCO",   flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", probability: 12.5, confederation: "UEFA",                  group: "C" },

  // Group D – 4 teams, 1st place leads to Match 96: P = 1/4 × 0.5 = 12.5%
  { name: "United States",                     code: "USA",   flag: "🇺🇸", probability: 12.5, confederation: "CONCACAF", isHost: true, group: "D" },
  { name: "Paraguay",                          code: "PAR",   flag: "🇵🇾", probability: 12.5, confederation: "CONMEBOL",              group: "D" },
  { name: "Australia",                         code: "AUS",   flag: "🇦🇺", probability: 12.5, confederation: "AFC",                   group: "D" },
  { name: "TBC (Türkiye / Kosovo)",            code: "TBC_D", flag: "🏳️",  probability: 12.5, confederation: "UEFA",                  group: "D" },

  // Group E – 4 teams, 2nd place leads to Match 96: P = 1/4 × 0.5 = 12.5%
  { name: "Germany",                           code: "GER",   flag: "🇩🇪", probability: 12.5, confederation: "UEFA",                  group: "E" },
  { name: "Curaçao",                           code: "CUW",   flag: "🇨🇼", probability: 12.5, confederation: "CONCACAF",              group: "E" },
  { name: "Ivory Coast",                       code: "CIV",   flag: "🇨🇮", probability: 12.5, confederation: "CAF",                   group: "E" },
  { name: "Ecuador",                           code: "ECU",   flag: "🇪🇨", probability: 12.5, confederation: "CONMEBOL",              group: "E" },

  // Group F – not on Match 96 bracket path (probability = 0)
  { name: "Netherlands",                       code: "NED",   flag: "🇳🇱", probability: 0,    confederation: "UEFA",                  group: "F" },
  { name: "Japan",                             code: "JPN",   flag: "🇯🇵", probability: 0,    confederation: "AFC",                   group: "F" },
  { name: "TBC (Sweden / Poland)",             code: "TBC_F", flag: "🏳️",  probability: 0,    confederation: "UEFA",                  group: "F" },
  { name: "Tunisia",                           code: "TUN",   flag: "🇹🇳", probability: 0,    confederation: "CAF",                   group: "F" },

  // Group G – not on Match 96 bracket path (probability = 0)
  { name: "Belgium",                           code: "BEL",   flag: "🇧🇪", probability: 0,    confederation: "UEFA",                  group: "G" },
  { name: "Egypt",                             code: "EGY",   flag: "🇪🇬", probability: 0,    confederation: "CAF",                   group: "G" },
  { name: "Iran",                              code: "IRN",   flag: "🇮🇷", probability: 0,    confederation: "AFC",                   group: "G" },
  { name: "New Zealand",                       code: "NZL",   flag: "🇳🇿", probability: 0,    confederation: "OFC",                   group: "G" },

  // Group H – not on Match 96 bracket path (probability = 0)
  { name: "Spain",                             code: "ESP",   flag: "🇪🇸", probability: 0,    confederation: "UEFA",                  group: "H" },
  { name: "Cape Verde",                        code: "CPV",   flag: "🇨🇻", probability: 0,    confederation: "CAF",                   group: "H" },
  { name: "Saudi Arabia",                      code: "KSA",   flag: "🇸🇦", probability: 0,    confederation: "AFC",                   group: "H" },
  { name: "Uruguay",                           code: "URU",   flag: "🇺🇾", probability: 0,    confederation: "CONMEBOL",              group: "H" },

  // Group I – not on Match 96 bracket path (probability = 0)
  { name: "France",                            code: "FRA",   flag: "🇫🇷", probability: 0,    confederation: "UEFA",                  group: "I" },
  { name: "Senegal",                           code: "SEN",   flag: "🇸🇳", probability: 0,    confederation: "CAF",                   group: "I" },
  { name: "TBC (Iraq / Bolivia)",              code: "TBC_I", flag: "🏳️",  probability: 0,    confederation: "AFC",                   group: "I" },
  { name: "Norway",                            code: "NOR",   flag: "🇳🇴", probability: 0,    confederation: "UEFA",                  group: "I" },

  // Group J – not on Match 96 bracket path (probability = 0)
  { name: "Argentina",                         code: "ARG",   flag: "🇦🇷", probability: 0,    confederation: "CONMEBOL",              group: "J" },
  { name: "Algeria",                           code: "ALG",   flag: "🇩🇿", probability: 0,    confederation: "CAF",                   group: "J" },
  { name: "Austria",                           code: "AUT",   flag: "🇦🇹", probability: 0,    confederation: "UEFA",                  group: "J" },
  { name: "Jordan",                            code: "JOR",   flag: "🇯🇴", probability: 0,    confederation: "AFC",                   group: "J" },

  // Group K – not on Match 96 bracket path (probability = 0)
  { name: "Portugal",                          code: "POR",   flag: "🇵🇹", probability: 0,    confederation: "UEFA",                  group: "K" },
  { name: "TBC (DR Congo / Jamaica)",          code: "TBC_K", flag: "🏳️",  probability: 0,    confederation: "CAF",                   group: "K" },
  { name: "Uzbekistan",                        code: "UZB",   flag: "🇺🇿", probability: 0,    confederation: "AFC",                   group: "K" },
  { name: "Colombia",                          code: "COL",   flag: "🇨🇴", probability: 0,    confederation: "CONMEBOL",              group: "K" },

  // Group L – not on Match 96 bracket path (probability = 0)
  { name: "England",                           code: "ENG",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", probability: 0,    confederation: "UEFA",                  group: "L" },
  { name: "Croatia",                           code: "CRO",   flag: "🇭🇷", probability: 0,    confederation: "UEFA",                  group: "L" },
  { name: "Ghana",                             code: "GHA",   flag: "🇬🇭", probability: 0,    confederation: "CAF",                   group: "L" },
  { name: "Panama",                            code: "PAN",   flag: "🇵🇦", probability: 0,    confederation: "CONCACAF",              group: "L" },
];

// ---------------------------------------------------------------------------
// Group sizes
// Computed once from BASE_PROBABILITIES so that the uniform probability
// formula  1 / groupSize  is always consistent with the team list.
// ---------------------------------------------------------------------------

const GROUP_SIZES = {};
BASE_PROBABILITIES.forEach((t) => {
  GROUP_SIZES[t.group] = (GROUP_SIZES[t.group] ?? 0) + 1;
});

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

  // Track how many matches have been played (for the status bar), but do not
  // apply any probability adjustments – the uniform model (equal chance per
  // team, no results yet) is the source of truth until a real API is wired up.
  const now = Date.now();
  const simulatedMatchInterval = 90 * 60 * 1000; // 90 min per simulated match
  const simulatedMatchesDone = Math.floor((now - Date.UTC(2026, 5, 11)) / simulatedMatchInterval);
  const matchesCompleted = Math.max(0, simulatedMatchesDone);

  return { matchesCompleted, adjustments: {} };
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

// ---------------------------------------------------------------------------
// Tournament bracket paths to Match 96
//
// Match 96 (Round of 16) at BC Place, Vancouver on July 7, 2026 is fed by
// two Round of 32 matchups:
//
//   R32-87 : 1st place Group C  vs  2nd place Group B
//   R32-88 : 1st place Group D  vs  2nd place Group E
//
// Teams in Groups B, C, D and E each have exactly one group-finish position
// that places them on the path to Match 96. Every other group (A, F–L) does
// not lead to BC Place in this round.
//
// Groups B and C at a glance (FIFA 2026 draw):
//   Group B : Canada 🇨🇦  TBC (Italy/Bosnia) 🏳️  Qatar 🇶🇦  Switzerland 🇨🇭
//   Group C : Brazil 🇧🇷  Morocco 🇲🇦  Haiti 🇭🇹  Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿
//   Group D : United States 🇺🇸  Paraguay 🇵🇾  Australia 🇦🇺  TBC (Türkiye/Kosovo) 🏳️
//   Group E : Germany 🇩🇪  Curaçao 🇨🇼  Ivory Coast 🇨🇮  Ecuador 🇪🇨
// ---------------------------------------------------------------------------

/**
 * The bracket structure that determines which group-stage outcomes lead to
 * Match 96 at BC Place.
 */
export const MATCH_96_BRACKET = {
  // Slot 1 enters Match 96 via R32 Match 87
  slot1: {
    r32Label: "R32 Match 87",
    sideA: { group: "C", position: 1 }, // 1st Group C plays 2nd Group B
    sideB: { group: "B", position: 2 }, // 2nd Group B plays 1st Group C
  },
  // Slot 2 enters Match 96 via R32 Match 88
  slot2: {
    r32Label: "R32 Match 88",
    sideA: { group: "D", position: 1 }, // 1st Group D plays 2nd Group E
    sideB: { group: "E", position: 2 }, // 2nd Group E plays 1st Group D
  },
};

/**
 * Build the list of scenario paths a team can take to reach Match 96 at
 * BC Place, Vancouver.
 *
 * Probabilities are computed using the uniform model:
 *
 *   P(this scenario) = (1/own-group-size) × (1/opp-group-size) × KNOCKOUT_WIN_PROB
 *
 * Every group has exactly 4 teams. With equal finishing chances and a 50/50
 * knockout match, every scenario for every team has identical probability:
 *   1/4 × 1/4 × 0.5 × 100 = 3.125%
 *
 * @param {Object} team  A team entry from BASE_PROBABILITIES (with `.group`).
 * @returns {Array}  Array of path scenario objects, or empty array when the
 *                   team's group does not feed into Match 96.
 */
export function buildTeamPaths(team) {
  const { code, group } = team;
  const { slot1, slot2 } = MATCH_96_BRACKET;

  // Determine whether this team is on the path and which position is needed
  let requiredPosition = null;
  let opponentGroup    = null;
  let r32Label         = null;

  if (group === slot1.sideA.group) {
    requiredPosition = 1;
    opponentGroup    = slot1.sideB.group;
    r32Label         = slot1.r32Label;
  } else if (group === slot1.sideB.group) {
    requiredPosition = 2;
    opponentGroup    = slot1.sideA.group;
    r32Label         = slot1.r32Label;
  } else if (group === slot2.sideA.group) {
    requiredPosition = 1;
    opponentGroup    = slot2.sideB.group;
    r32Label         = slot2.r32Label;
  } else if (group === slot2.sideB.group) {
    requiredPosition = 2;
    opponentGroup    = slot2.sideA.group;
    r32Label         = slot2.r32Label;
  } else {
    return [];
  }

  // Uniform probability: each team has an equal 1/N chance of finishing in
  // any given position, and a 50% chance of winning the knockout match.
  const ownGroupSize    = GROUP_SIZES[group]         ?? 4;
  const oppGroupSize    = GROUP_SIZES[opponentGroup] ?? 4;
  const scenarioProbPct = (1 / ownGroupSize) * (1 / oppGroupSize) * KNOCKOUT_WIN_PROB * 100;
  const scenarioProbPctRounded = Math.round(scenarioProbPct * 1000) / 1000; // 3 decimal places

  // Every eligible opponent in the opposing group is equally likely
  const opponents = BASE_PROBABILITIES.filter((t) => t.group === opponentGroup);

  return opponents.map((opp) => ({
    groupFinishLabel : `${requiredPosition === 1 ? "1st" : "2nd"} in Group ${group}`,
    requiredPosition,
    r32Label,
    r32Opponent      : { name: opp.name, code: opp.code, flag: opp.flag },
    probability      : scenarioProbPctRounded,
  }));
}

/**
 * Return tournament path data for every team that has a route to Match 96.
 * Teams whose group does not feed into Match 96 are omitted.
 *
 * @param {Array} teams  Array of team objects (from getMatchProbabilities /
 *                       getNotableProbabilities). Each must have a `.group` field.
 * @returns {Array}  Array of { team, paths } objects, sorted so that
 *                   teams with the highest total probability appear first.
 */
export function getTournamentPaths(teams) {
  return teams
    .map((team) => ({ team, paths: buildTeamPaths(team) }))
    .filter(({ paths }) => paths.length > 0)
    .sort((a, b) => b.team.probability - a.team.probability);
}

// ---------------------------------------------------------------------------

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
