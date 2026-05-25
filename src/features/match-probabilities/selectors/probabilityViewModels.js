import { TEAM_DATA } from "../../../config/worldCupConfig.js";

export function getBracketSlots(bracket) {
  return Object.entries(bracket ?? {}).sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true })
  );
}

export function getTeamBrackets(bracket) {
  const bracketSlots = getBracketSlots(bracket);
  return {
    bracketSlots,
    team1Bracket: bracketSlots[0] ? { [bracketSlots[0][0]]: bracketSlots[0][1] } : {},
    team2Bracket: bracketSlots[1] ? { [bracketSlots[1][0]]: bracketSlots[1][1] } : {},
  };
}

export function buildDisplayAllTeams({
  allTeams,
  bracket,
  team1Bracket,
  team2Bracket,
  simulatedResults,
  isSimulating,
  probabilityEngine,
  simulatorEngine,
}) {
  if (!isSimulating) {
    return allTeams.map((team) => ({
      ...team,
      probability: probabilityEngine.computeProbabilityForMatch(team, bracket),
      team1Probability: probabilityEngine.computeProbabilityForMatch(team, team1Bracket),
      team2Probability: probabilityEngine.computeProbabilityForMatch(team, team2Bracket),
    }));
  }

  const simulatedProbabilities = simulatorEngine.computeSimulatedProbabilities(simulatedResults, bracket);
  const simulatedTeam1Probabilities = simulatorEngine.computeSimulatedProbabilities(simulatedResults, team1Bracket);
  const simulatedTeam2Probabilities = simulatorEngine.computeSimulatedProbabilities(simulatedResults, team2Bracket);

  return [...TEAM_DATA]
    .map((team) => ({
      ...team,
      probability: simulatedProbabilities[team.code] ?? 0,
      team1Probability: simulatedTeam1Probabilities[team.code] ?? 0,
      team2Probability: simulatedTeam2Probabilities[team.code] ?? 0,
    }))
    .sort((left, right) => right.probability - left.probability);
}

export function filterDisplayTeams(displayAllTeams, threshold = 1) {
  return displayAllTeams.filter((team) => team.probability > threshold);
}

export function buildSpotlightDisplayTeam(displayAllTeams, selectedSpotlightTeamMeta) {
  if (!selectedSpotlightTeamMeta) return null;

  const spotlightTeam = displayAllTeams.find((team) => team.code === selectedSpotlightTeamMeta.code);
  if (spotlightTeam) return spotlightTeam;

  return {
    ...selectedSpotlightTeamMeta,
    probability: 0,
    team1Probability: 0,
    team2Probability: 0,
  };
}

export function shouldShowSpotlightSection(hasValidSpotlightSelection, displaySpotlightTeam) {
  return Boolean(
    hasValidSpotlightSelection &&
      displaySpotlightTeam &&
      !(displaySpotlightTeam.code === "CAN" && displaySpotlightTeam.probability <= 0)
  );
}

function buildRoleLines(team) {
  const team1Probability = team.team1Probability ?? 0;
  const team2Probability = team.team2Probability ?? 0;
  const showTeam1 = team1Probability >= 1;
  const showTeam2 = team2Probability >= 1;

  if (showTeam1 && showTeam2) {
    const roundedTeam1 = Number(team1Probability.toFixed(1));
    const roundedTeam2 = Number(team2Probability.toFixed(1));
    if (roundedTeam1 === roundedTeam2) {
      return [`both team 1 & 2 (${roundedTeam1.toFixed(1)}%)`];
    }

    return [
      `team 1 (${team1Probability.toFixed(1)}%)`,
      `team 2 (${team2Probability.toFixed(1)}%)`,
    ];
  }

  if (showTeam1) return [`team 1 (${team1Probability.toFixed(1)}%)`];
  if (showTeam2) return [`team 2 (${team2Probability.toFixed(1)}%)`];
  return ["—"];
}

export function buildProbabilityRows(teams) {
  return teams.map((team, index) => ({
    id: team.code,
    rank: index + 1,
    flag: team.flag,
    name: team.name,
    confederation: team.confederation,
    probabilityLabel: `${team.probability.toFixed(1)}%`,
    roleLines: buildRoleLines(team),
    isHost: Boolean(team.isHost),
    isHighlighted: team.code === "CAN",
    barWidth: team.probability,
  }));
}

export function buildSpotlightCardViewModel(team, matchInfo) {
  if (!team) return null;

  return {
    flag: team.flag,
    name: team.name,
    probability: team.probability,
    probabilityLabel: team.probability <= 0 ? "Eliminated" : `${team.probability.toFixed(1)}%`,
    matchLabel: `Match ${matchInfo.matchNumber} (${matchInfo.stage}) at ${matchInfo.venue}, ${matchInfo.city}`,
  };
}

export function buildTournamentPathViewModel({ teamPaths, matchInfo, bracketNotes }) {
  return {
    intro: `To appear in Match ${matchInfo.matchNumber} at ${matchInfo.venue}, ${matchInfo.city} on ${matchInfo.scheduledDate}, a team must finish in a specific position in their group and then win one Round of 32 game. Each row below is a distinct scenario. Probabilities reflect the estimated chance of that exact path occurring.`,
    bracketNotes,
    cards: teamPaths.map(({ team, paths }) => ({
      id: team.code,
      flag: team.flag,
      name: team.name,
      isHost: Boolean(team.isHost),
      isHighlighted: team.code === "CAN",
      groupLabel: `Group ${team.group}`,
      totalProbabilityLabel: `${team.probability.toFixed(1)}%`,
      roundLabel: `📍 ${matchInfo.venue}, ${matchInfo.city}`,
      scenarios: paths.map((scenario, index) => ({
        id: `${team.code}-${index}`,
        groupFinishLabel: scenario.groupFinishLabel,
        opponentFlag: scenario.r32Opponent.flag,
        opponentName: scenario.r32Opponent.name,
        roundLabel: `📍 ${matchInfo.venue}, ${matchInfo.city}`,
        r32Label: scenario.r32Label,
        probabilityLabel: `${scenario.probability.toFixed(1)}%`,
      })),
    })),
  };
}

export function buildLastUpdatedViewModel(lastUpdated, matchesCompleted, refreshInterval) {
  if (!lastUpdated) return null;

  const timeLabel = lastUpdated.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = lastUpdated.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    updatedLabel: `${dateLabel} at ${timeLabel}`,
    matchesCompletedLabel: `${matchesCompleted} match${matchesCompleted !== 1 ? "es" : ""} completed`,
    refreshIntervalLabel: `${Math.round(refreshInterval / 60000)} min`,
  };
}
