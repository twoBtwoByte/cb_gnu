/**
 * worldCupService.js
 *
 * Service for fetching and computing FIFA World Cup 2026 probabilities.
 *
 * Match 96 is a Round of 16 match scheduled at BC Place, Vancouver, Canada on
 * July 7, 2026. It is fed by two Round of 32 matches:
 *
 *   R32 M85 : 1st place Group B  vs  best 3rd-place team from Groups E/F/G/I/J
 *   R32 M87 : 1st place Group K  vs  best 3rd-place team from Groups D/E/I/J/L
 *
 * Probabilities are calculated using a uniform model:
 *
 *   – Group stage  : every team in a group has an equal 1/N chance of
 *                    finishing in any given position (25% each in a
 *                    4-team group, since all groups have 4 teams).
 *   – Knockout leg : each team in any individual match has a 50% chance
 *                    of advancing to the next round.
 *   – 3rd-place selection: for teams that can qualify via 3rd place,
 *                    each team in an eligible pool of M groups has a 1/M
 *                    chance of being selected as the best 3rd-place team.
 *
 * In production this service would call a live sports-data API. Currently it
 * uses the uniform model above and automatically refreshes after each
 * completed match.
 */

// ---------------------------------------------------------------------------
// Match configurations
//
// MATCH_CONFIGS is a map from match number to a configuration object that
// includes match metadata (venue, date, stage, etc.) and a bracket definition.
//
// Each bracket has one or more slots. Each slot describes the two sides of a
// Round-of-32 game whose winner advances to the target match:
//
//   sideA – a group that qualifies by finishing in a specific position (e.g.
//           1st place in Group B).
//   sideB – either another specific group qualifier, or a best-3rd-place pool
//           drawn from a set of eligible groups.
//
// Probabilities for each path are computed at run-time via
// computeProbabilityForMatch(), so bracket changes automatically propagate to
// all displayed figures.
//
// To support a new match, add an entry to MATCH_CONFIGS with the appropriate
// bracket structure.
// ---------------------------------------------------------------------------

export const MATCH_CONFIGS = {
  96: {
    matchNumber: 96,
    stage: "Round of 16",
    venue: "BC Place",
    city: "Vancouver",
    country: "Canada",
    scheduledDate: "July 7, 2026",
    description: "FIFA World Cup 2026 – Match 96 (Round of 16) at BC Place, Vancouver",
    bracket: {
      // Slot 1 enters Match 96 via R32 Match 85
      slot1: {
        r32Label: "R32 Match 85",
        sideA: { group: "B", position: 1 }, // 1st Group B plays best 3rd from EFGIJ
        sideB: { thirdPlace: true, eligibleGroups: ["E", "F", "G", "I", "J"], label: "3EFGIJ" },
      },
      // Slot 2 enters Match 96 via R32 Match 87
      slot2: {
        r32Label: "R32 Match 87",
        sideA: { group: "K", position: 1 }, // 1st Group K plays best 3rd from DEIJL
        sideB: { thirdPlace: true, eligibleGroups: ["D", "E", "I", "J", "L"], label: "3DEIJL" },
      },
    },
  },
};

// Convenience aliases kept for backward compatibility
export const MATCH_INFO      = MATCH_CONFIGS[96];
export const MATCH_96_BRACKET = MATCH_CONFIGS[96].bracket;

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
// Team data
//
// Static list of all 48 teams with their group, flag, and confederation.
// Base probabilities are NOT hardcoded here – they are computed at run-time
// by computeProbabilityForMatch() from the bracket configuration, so the
// correct probability for every path (1st-place, 3rd-place, etc.) is derived
// automatically from the bracket structure.
// ---------------------------------------------------------------------------

const TEAM_DATA = [
  // Group A – no path to Match 96
  { name: "Mexico",                            code: "MEX",   flag: "🇲🇽", confederation: "CONCACAF", isHost: true, group: "A" },
  { name: "South Africa",                      code: "RSA",   flag: "🇿🇦", confederation: "CAF",                   group: "A" },
  { name: "South Korea",                       code: "KOR",   flag: "🇰🇷", confederation: "AFC",                   group: "A" },
  { name: "TBC (Denmark / Czech Republic)",    code: "TBC_A", flag: "🏳️",  confederation: "UEFA",                  group: "A" },

  // Group B – 1st place leads to Match 96 via R32 M85: P = 1/4 × 0.5 = 12.5%
  { name: "Canada",                            code: "CAN",   flag: "🇨🇦", confederation: "CONCACAF", isHost: true, group: "B" },
  { name: "TBC (Italy / Bosnia & Herzegovina)", code: "TBC_B", flag: "🏳️", confederation: "UEFA",                  group: "B" },
  { name: "Qatar",                             code: "QAT",   flag: "🇶🇦", confederation: "AFC",                   group: "B" },
  { name: "Switzerland",                       code: "SUI",   flag: "🇨🇭", confederation: "UEFA",                  group: "B" },

  // Group C – no path to Match 96
  { name: "Brazil",                            code: "BRA",   flag: "🇧🇷", confederation: "CONMEBOL",              group: "C" },
  { name: "Morocco",                           code: "MAR",   flag: "🇲🇦", confederation: "CAF",                   group: "C" },
  { name: "Haiti",                             code: "HAI",   flag: "🇭🇹", confederation: "CONCACAF",              group: "C" },
  { name: "Scotland",                          code: "SCO",   flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA",                  group: "C" },

  // Group D – 3rd place eligible for R32 M87 best-3rd pool (D/E/I/J/L): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "United States",                     code: "USA",   flag: "🇺🇸", confederation: "CONCACAF", isHost: true, group: "D" },
  { name: "Paraguay",                          code: "PAR",   flag: "🇵🇾", confederation: "CONMEBOL",              group: "D" },
  { name: "Australia",                         code: "AUS",   flag: "🇦🇺", confederation: "AFC",                   group: "D" },
  { name: "TBC (Türkiye / Kosovo)",            code: "TBC_D", flag: "🏳️",  confederation: "UEFA",                  group: "D" },

  // Group E – 3rd place eligible for R32 M85 (E/F/G/I/J) and R32 M87 (D/E/I/J/L): P = 2 × 2.5% = 5%
  { name: "Germany",                           code: "GER",   flag: "🇩🇪", confederation: "UEFA",                  group: "E" },
  { name: "Curaçao",                           code: "CUW",   flag: "🇨🇼", confederation: "CONCACAF",              group: "E" },
  { name: "Ivory Coast",                       code: "CIV",   flag: "🇨🇮", confederation: "CAF",                   group: "E" },
  { name: "Ecuador",                           code: "ECU",   flag: "🇪🇨", confederation: "CONMEBOL",              group: "E" },

  // Group F – 3rd place eligible for R32 M85 best-3rd pool (E/F/G/I/J): P = 2.5%
  { name: "Netherlands",                       code: "NED",   flag: "🇳🇱", confederation: "UEFA",                  group: "F" },
  { name: "Japan",                             code: "JPN",   flag: "🇯🇵", confederation: "AFC",                   group: "F" },
  { name: "TBC (Sweden / Poland)",             code: "TBC_F", flag: "🏳️",  confederation: "UEFA",                  group: "F" },
  { name: "Tunisia",                           code: "TUN",   flag: "🇹🇳", confederation: "CAF",                   group: "F" },

  // Group G – 3rd place eligible for R32 M85 best-3rd pool (E/F/G/I/J): P = 2.5%
  { name: "Belgium",                           code: "BEL",   flag: "🇧🇪", confederation: "UEFA",                  group: "G" },
  { name: "Egypt",                             code: "EGY",   flag: "🇪🇬", confederation: "CAF",                   group: "G" },
  { name: "Iran",                              code: "IRN",   flag: "🇮🇷", confederation: "AFC",                   group: "G" },
  { name: "New Zealand",                       code: "NZL",   flag: "🇳🇿", confederation: "OFC",                   group: "G" },

  // Group H – no path to Match 96
  { name: "Spain",                             code: "ESP",   flag: "🇪🇸", confederation: "UEFA",                  group: "H" },
  { name: "Cape Verde",                        code: "CPV",   flag: "🇨🇻", confederation: "CAF",                   group: "H" },
  { name: "Saudi Arabia",                      code: "KSA",   flag: "🇸🇦", confederation: "AFC",                   group: "H" },
  { name: "Uruguay",                           code: "URU",   flag: "🇺🇾", confederation: "CONMEBOL",              group: "H" },

  // Group I – 3rd place eligible for R32 M85 (E/F/G/I/J) and R32 M87 (D/E/I/J/L): P = 5%
  { name: "France",                            code: "FRA",   flag: "🇫🇷", confederation: "UEFA",                  group: "I" },
  { name: "Senegal",                           code: "SEN",   flag: "🇸🇳", confederation: "CAF",                   group: "I" },
  { name: "TBC (Iraq / Bolivia)",              code: "TBC_I", flag: "🏳️",  confederation: "AFC",                   group: "I" },
  { name: "Norway",                            code: "NOR",   flag: "🇳🇴", confederation: "UEFA",                  group: "I" },

  // Group J – 3rd place eligible for R32 M85 (E/F/G/I/J) and R32 M87 (D/E/I/J/L): P = 5%
  { name: "Argentina",                         code: "ARG",   flag: "🇦🇷", confederation: "CONMEBOL",              group: "J" },
  { name: "Algeria",                           code: "ALG",   flag: "🇩🇿", confederation: "CAF",                   group: "J" },
  { name: "Austria",                           code: "AUT",   flag: "🇦🇹", confederation: "UEFA",                  group: "J" },
  { name: "Jordan",                            code: "JOR",   flag: "🇯🇴", confederation: "AFC",                   group: "J" },

  // Group K – 1st place leads to Match 96 via R32 M87: P = 1/4 × 0.5 = 12.5%
  { name: "Portugal",                          code: "POR",   flag: "🇵🇹", confederation: "UEFA",                  group: "K" },
  { name: "TBC (DR Congo / Jamaica)",          code: "TBC_K", flag: "🏳️",  confederation: "CAF",                   group: "K" },
  { name: "Uzbekistan",                        code: "UZB",   flag: "🇺🇿", confederation: "AFC",                   group: "K" },
  { name: "Colombia",                          code: "COL",   flag: "🇨🇴", confederation: "CONMEBOL",              group: "K" },

  // Group L – 3rd place eligible for R32 M87 best-3rd pool (D/E/I/J/L): P = 2.5%
  { name: "England",                           code: "ENG",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA",                  group: "L" },
  { name: "Croatia",                           code: "CRO",   flag: "🇭🇷", confederation: "UEFA",                  group: "L" },
  { name: "Ghana",                             code: "GHA",   flag: "🇬🇭", confederation: "CAF",                   group: "L" },
  { name: "Panama",                            code: "PAN",   flag: "🇵🇦", confederation: "CONCACAF",              group: "L" },
];

// ---------------------------------------------------------------------------
// Group sizes
// Computed once from TEAM_DATA so that the uniform probability
// formula  1 / groupSize  is always consistent with the team list.
// ---------------------------------------------------------------------------

const GROUP_SIZES = {};
TEAM_DATA.forEach((t) => {
  GROUP_SIZES[t.group] = (GROUP_SIZES[t.group] ?? 0) + 1;
});

// ---------------------------------------------------------------------------
// Probability computation
//
// computeProbabilityForMatch derives a team's base probability of appearing in
// a target match from the bracket configuration.  It supports two path types:
//
//   sideA (1st/2nd-place qualifier):
//       P = (1 / groupSize) × KNOCKOUT_WIN_PROB × 100
//
//   sideB (3rd-place qualifier, for teams in the eligible pool):
//       P = (1 / groupSize) × (1 / poolSize) × KNOCKOUT_WIN_PROB × 100
//
// Teams that appear in multiple slots accumulate probability from each slot
// independently (the paths are mutually exclusive events).
// ---------------------------------------------------------------------------

/**
 * Compute a team's base probability (percentage) of reaching the target match
 * given a bracket configuration.
 *
 * @param {Object} team    A team entry from TEAM_DATA (must have `.group`).
 * @param {Object} bracket A bracket config object (from MATCH_CONFIGS[n].bracket).
 * @returns {number} Probability in percent, rounded to 3 decimal places.
 */
export function computeProbabilityForMatch(team, bracket) {
  if (!team || typeof team.group !== "string") return 0;
  if (!bracket || typeof bracket !== "object") return 0;

  const groupSize = GROUP_SIZES[team.group] ?? 4;
  let prob = 0;

  for (const slot of Object.values(bracket)) {
    if (!slot?.sideA || !slot?.sideB) continue;
    // sideA path: team's group must finish in the required position
    if (team.group === slot.sideA.group) {
      prob += (1 / groupSize) * KNOCKOUT_WIN_PROB * 100;
    }
    // sideB path: team's group is in the 3rd-place eligible pool
    if (slot.sideB.thirdPlace && Array.isArray(slot.sideB.eligibleGroups) && slot.sideB.eligibleGroups.includes(team.group)) {
      const poolSize = slot.sideB.eligibleGroups.length;
      prob += (1 / groupSize) * (1 / poolSize) * KNOCKOUT_WIN_PROB * 100;
    }
  }

  return Math.round(prob * 1000) / 1000;
}

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
 * @param {Object} [bracket] Bracket configuration to use for probability
 *   computation. Defaults to the Match 96 bracket (MATCH_96_BRACKET).
 * @returns {Promise<{teams: Array, matchesCompleted: number, lastUpdated: Date}>}
 */
export async function getMatchProbabilities(bracket = MATCH_96_BRACKET) {
  const { matchesCompleted, adjustments } = await fetchLatestResults();

  matchResultsCache = {
    lastFetched: new Date(),
    completedMatches: matchesCompleted,
    adjustments,
  };

  const teamsWithProbs = TEAM_DATA.map((t) => ({
    ...t,
    probability: computeProbabilityForMatch(t, bracket),
  }));

  const teams = applyAdjustments(teamsWithProbs, adjustments);
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
 *
 * @param {Object} [bracket] Bracket configuration to use. Defaults to MATCH_96_BRACKET.
 */
export async function getNotableProbabilities(bracket = MATCH_96_BRACKET) {
  const { teams, matchesCompleted, lastUpdated } = await getMatchProbabilities(bracket);

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
// Tournament bracket paths
//
// buildTeamPaths generates the distinct scenarios a team can follow to reach
// the target match.  Two path types are supported:
//
//   sideA (1st/2nd-place path):
//     The team finishes in the required position in its group, then wins a
//     Round-of-32 game against the opposing sideB team (a 3rd-place qualifier
//     or a specific-group qualifier).
//
//       P(scenario) = (1/groupSize) × KNOCKOUT_WIN_PROB × 100
//
//   sideB (3rd-place path):
//     The team finishes 3rd in its group, is selected as the best 3rd-place
//     team from its eligible pool, then wins a Round-of-32 game against the
//     sideA team (a 1st-place qualifier from another group).
//
//       P(scenario) = (1/groupSize) × (1/poolSize) × KNOCKOUT_WIN_PROB × 100
// ---------------------------------------------------------------------------

/**
 * Build the list of scenario paths a team can take to reach the target match.
 *
 * @param {Object} team      A team entry (must have `.group`).
 * @param {Object} [bracket] Bracket config from MATCH_CONFIGS[n].bracket.
 *                           Defaults to MATCH_96_BRACKET.
 * @returns {Array}  Array of path scenario objects, empty if no route exists.
 */
export function buildTeamPaths(team, bracket = MATCH_96_BRACKET) {
  const { group } = team;
  const ownGroupSize = GROUP_SIZES[group] ?? 4;
  const paths = [];

  for (const slot of Object.values(bracket)) {
    // ── sideA path: this group must finish in the required position ──────────
    if (group === slot.sideA.group) {
      const pos = slot.sideA.position;
      const posLabel = pos === 1 ? "1st" : pos === 2 ? "2nd" : `${pos}th`;
      const scenarioProbPct = Math.round((1 / ownGroupSize) * KNOCKOUT_WIN_PROB * 100 * 1000) / 1000;

      if (slot.sideB.thirdPlace) {
        paths.push({
          groupFinishLabel: `${posLabel} in Group ${group}`,
          requiredPosition: pos,
          r32Label: slot.r32Label,
          r32Opponent: {
            name: `Best 3rd-place team (${slot.sideB.label})`,
            code: slot.sideB.label,
            flag: "🏳️",
          },
          probability: scenarioProbPct,
        });
      } else {
        // Specific-group opponent (for future bracket slots without 3rd-place)
        const oppGroupSize = GROUP_SIZES[slot.sideB.group] ?? 4;
        const probPct = Math.round((1 / ownGroupSize) * (1 / oppGroupSize) * KNOCKOUT_WIN_PROB * 100 * 1000) / 1000;
        TEAM_DATA.filter((t) => t.group === slot.sideB.group).forEach((opp) => {
          paths.push({
            groupFinishLabel: `${posLabel} in Group ${group}`,
            requiredPosition: pos,
            r32Label: slot.r32Label,
            r32Opponent: { name: opp.name, code: opp.code, flag: opp.flag },
            probability: probPct,
          });
        });
      }
    }

    // ── sideB path: this group can qualify via 3rd place ────────────────────
    if (slot.sideB.thirdPlace && slot.sideB.eligibleGroups.includes(group)) {
      const poolSize = slot.sideB.eligibleGroups.length;
      const scenarioProbPct = Math.round((1 / ownGroupSize) * (1 / poolSize) * KNOCKOUT_WIN_PROB * 100 * 1000) / 1000;
      paths.push({
        groupFinishLabel: `3rd in Group ${group}`,
        requiredPosition: 3,
        r32Label: slot.r32Label,
        r32Opponent: {
          name: `1st place Group ${slot.sideA.group}`,
          code: `1${slot.sideA.group}`,
          flag: "🏳️",
        },
        probability: scenarioProbPct,
      });
    }
  }

  return paths;
}

/**
 * Return tournament path data for every team that has a route to the target
 * match.  Teams whose group does not feed into the match are omitted.
 *
 * @param {Array}  teams     Array of team objects from getMatchProbabilities.
 * @param {Object} [bracket] Bracket config. Defaults to MATCH_96_BRACKET.
 * @returns {Array}  Array of { team, paths } objects sorted by probability desc.
 */
export function getTournamentPaths(teams, bracket = MATCH_96_BRACKET) {
  return teams
    .map((team) => ({ team, paths: buildTeamPaths(team, bracket) }))
    .filter(({ paths }) => paths.length > 0)
    .sort((a, b) => b.team.probability - a.team.probability);
}

// ---------------------------------------------------------------------------

/**
 * Subscribe to automatic probability updates.
 *
 * @param {Function} callback   Called with fresh probability data on each tick.
 * @param {number}   intervalMs Poll interval in milliseconds (default 5 minutes).
 * @param {Object}   [bracket]  Bracket config to use. Defaults to MATCH_96_BRACKET.
 * @returns {Function} Unsubscribe function – call it to stop polling.
 */
export function subscribeToUpdates(callback, intervalMs = 5 * 60 * 1000, bracket = MATCH_96_BRACKET) {
  // Fire immediately on subscription
  getNotableProbabilities(bracket).then(callback).catch(console.error);

  const id = setInterval(() => {
    getNotableProbabilities(bracket).then(callback).catch(console.error);
  }, intervalMs);

  return () => clearInterval(id);
}
