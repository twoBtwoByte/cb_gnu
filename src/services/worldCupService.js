/**
 * Compatibility facade for the refactored probability domain/application modules.
 */
export { MATCH_CONFIGS, TEAM_DATA } from "../config/worldCupConfig.js";
export {
  MATCH_INFO,
  MATCH_96_BRACKET,
  createProbabilityRepository,
  defaultProbabilityRepository,
  getMatchProbabilities,
  getNotableProbabilities,
  subscribeToUpdates,
} from "../application/probabilityRepository.js";
export {
  KNOCKOUT_WIN_PROB,
  computeProbabilityForMatch,
} from "../domain/probability/computeProbabilityForMatch.js";
export { computeSimulatedProbabilities } from "../domain/probability/computeSimulatedProbabilities.js";
export {
  getSimulatorGroups,
  generateGroupMatches,
  isGroupComplete,
  computeGroupStandings,
} from "../domain/simulator/standings.js";
export { buildTeamPaths, getTournamentPaths } from "../domain/tournament/buildTeamPaths.js";
