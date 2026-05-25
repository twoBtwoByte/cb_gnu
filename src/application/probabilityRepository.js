import { MATCH_CONFIGS, TEAM_DATA } from "../config/worldCupConfig.js";
import { defaultResultsGateway } from "../data/gateways/resultsGateway.js";
import { computeProbabilityForMatch } from "../domain/probability/computeProbabilityForMatch.js";

export const MATCH_INFO = MATCH_CONFIGS[96];
export const MATCH_96_BRACKET = MATCH_INFO.bracket;

function applyAdjustments(teams, adjustments) {
  return teams.map((team) => ({
    ...team,
    probability: Math.max(0, team.probability + (adjustments[team.code] ?? 0)),
  }));
}

export function createProbabilityRepository({ resultsGateway = defaultResultsGateway } = {}) {
  let matchResultsCache = {
    lastFetched: null,
    completedMatches: 0,
    adjustments: {},
  };

  async function getMatchProbabilities(bracket = MATCH_96_BRACKET) {
    const { matchesCompleted, adjustments } = await resultsGateway.getLatestResults();

    matchResultsCache = {
      lastFetched: new Date(),
      completedMatches: matchesCompleted,
      adjustments,
    };

    const teamsWithProbabilities = TEAM_DATA.map((team) => ({
      ...team,
      probability: computeProbabilityForMatch(team, bracket),
    }));

    const teams = applyAdjustments(teamsWithProbabilities, adjustments);
    teams.sort((a, b) => b.probability - a.probability);

    return {
      teams,
      matchesCompleted,
      lastUpdated: matchResultsCache.lastFetched,
    };
  }

  async function getNotableProbabilities(bracket = MATCH_96_BRACKET) {
    const { teams, matchesCompleted, lastUpdated } = await getMatchProbabilities(bracket);
    return {
      teams: teams.filter((team) => team.probability > 1),
      allTeams: teams,
      canada: teams.find((team) => team.code === "CAN"),
      matchesCompleted,
      lastUpdated,
    };
  }

  function subscribeToUpdates(callback, intervalMs = 5 * 60 * 1000, bracket = MATCH_96_BRACKET) {
    getNotableProbabilities(bracket).then(callback).catch(console.error);

    const intervalId = setInterval(() => {
      getNotableProbabilities(bracket).then(callback).catch(console.error);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }

  return {
    getMatchProbabilities,
    getNotableProbabilities,
    subscribeToUpdates,
    getCache: () => matchResultsCache,
  };
}

export const defaultProbabilityRepository = createProbabilityRepository();
export const getMatchProbabilities = defaultProbabilityRepository.getMatchProbabilities;
export const getNotableProbabilities = defaultProbabilityRepository.getNotableProbabilities;
export const subscribeToUpdates = defaultProbabilityRepository.subscribeToUpdates;
