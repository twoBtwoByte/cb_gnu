/**
 * Mock completed match results for isolated probability testing.
 * These scenarios are designed to test knockout probability propagation
 * without depending on the dynamic public/data/completedMatchResults.json file.
 */

/**
 * Scenario 1: Canada wins through Round of 32 to test probability propagation
 * Bracket structure:
 * - Match 73: Canada vs South Africa (Round of 32)
 * - Match 75: Netherlands vs Morocco (Round of 32)
 * - Match 90: Winner 73 vs Winner 75 (Round of 16)
 * - Match 89: Winner 74 vs Winner 77 (Round of 16)
 * - Match 97: Winner 89 vs Winner 90 (Quarter-final)
 * - Match 98: Winner 93 vs Winner 94 (Quarter-final)
 * - Match 101: Winner 97 vs Winner 98 (Semi-final)
 * - Match 104: Winner 101 vs Winner 102 (Final)
 */
export const canadaAdvancementScenario = {
  // Canada wins Round of 32
  73: {
    homeTeam: "South Africa",
    awayTeam: "Canada",
    homeScore: 0,
    awayScore: 1,
  },
  // Morocco wins Round of 32
  75: {
    homeTeam: "Netherlands",
    awayTeam: "Morocco",
    homeScore: 3,
    awayScore: 4,
  },
  // Canada wins Round of 16 against Morocco
  90: {
    homeTeam: "Canada",
    awayTeam: "Morocco",
    homeScore: 2,
    awayScore: 1,
  },
};

/**
 * Scenario 2: Canada advances through Quarter-final
 * This requires both slots of match 97 to be resolved
 */
export const canadaQuarterFinalScenario = {
  ...canadaAdvancementScenario,
  // France wins Round of 32 and Round of 16 to face Canada in QF
  77: {
    homeTeam: "France",
    awayTeam: "Sweden",
    homeScore: 3,
    awayScore: 0,
  },
  74: {
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    homeScore: 4,
    awayScore: 5,
  },
  89: {
    homeTeam: "Paraguay",
    awayTeam: "France",
    homeScore: 0,
    awayScore: 1,
  },
  // Canada wins Quarter-final
  97: {
    homeTeam: "France",
    awayTeam: "Canada",
    homeScore: 1,
    awayScore: 2,
  },
};

/**
 * Scenario 3: Canada advances to Final
 */
export const canadaSemiFinalScenario = {
  ...canadaQuarterFinalScenario,
  // Set up winner of match 98 (other QF)
  81: {
    homeTeam: "USA",
    awayTeam: "Bosnia-Herzegovina",
    homeScore: 2,
    awayScore: 0,
  },
  82: {
    homeTeam: "Belgium",
    awayTeam: "Senegal",
    homeScore: 3,
    awayScore: 2,
  },
  94: {
    homeTeam: "USA",
    awayTeam: "Belgium",
    homeScore: 3,
    awayScore: 1,
  },
  83: {
    homeTeam: "Portugal",
    awayTeam: "Croatia",
    homeScore: 2,
    awayScore: 1,
  },
  84: {
    homeTeam: "Spain",
    awayTeam: "Austria",
    homeScore: 3,
    awayScore: 0,
  },
  93: {
    homeTeam: "Portugal",
    awayTeam: "Spain",
    homeScore: 0,
    awayScore: 1,
  },
  98: {
    homeTeam: "Spain",
    awayTeam: "USA",
    homeScore: 2,
    awayScore: 1,
  },
  // Canada wins Semi-final
  101: {
    homeTeam: "Canada",
    awayTeam: "Spain",
    homeScore: 2,
    awayScore: 1,
  },
};

/**
 * Scenario 4: Team eliminated in Round of 32 - should not appear in later rounds
 */
export const earlyEliminationScenario = {
  73: {
    homeTeam: "South Africa",
    awayTeam: "Canada",
    homeScore: 2,
    awayScore: 0,
  },
};

/**
 * Scenario 5: Multiple paths convergence - test complex probability calculations
 */
export const complexProbabilityScenario = {
  79: {
    homeTeam: "Mexico",
    awayTeam: "Ecuador",
    homeScore: 2,
    awayScore: 0,
  },
  80: {
    homeTeam: "England",
    awayTeam: "Congo DR",
    homeScore: 2,
    awayScore: 1,
  },
  // Match 92: Mexico vs England (Round of 16)
  92: {
    homeTeam: "Mexico",
    awayTeam: "England",
    homeScore: 2,
    awayScore: 3,
  },
};

/**
 * Scenario 6: Draw/tie results should not affect probabilities
 * (teams treated as not yet resolved)
 */
export const drawScenario = {
  1: {
    homeTeam: "Mexico",
    awayTeam: "South Africa",
    homeScore: 1,
    awayScore: 1, // Draw - should be treated as unresolved
  },
};

/**
 * Scenario 7: USA winner advances through multiple rounds
 */
export const usaAdvancementScenario = {
  81: {
    homeTeam: "USA",
    awayTeam: "Bosnia-Herzegovina",
    homeScore: 2,
    awayScore: 0,
  },
  82: {
    homeTeam: "Belgium",
    awayTeam: "Senegal",
    homeScore: 3,
    awayScore: 2,
  },
  94: {
    homeTeam: "USA",
    awayTeam: "Belgium",
    homeScore: 3,
    awayScore: 1,
  },
};
