import { MATCH_CONFIGS, TEAM_DATA } from "../../config/worldCupConfig.js";
import { computeGroupStandings, isGroupComplete } from "../simulator/standings.js";
import { GROUP_SIZES, KNOCKOUT_WIN_PROB, roundProbability } from "../probability/computeProbabilityForMatch.js";

const MATCH_96_BRACKET = MATCH_CONFIGS[96].bracket;

function getPositionProbability(team, group, position, simulatedResults) {
  const groupSize = GROUP_SIZES[group] ?? 4;
  if (!simulatedResults || !isGroupComplete(group, simulatedResults)) {
    return 1 / groupSize;
  }

  const standings = computeGroupStandings(group, simulatedResults);
  return standings[position - 1]?.code === team.code ? 1 : 0;
}

function getSpecificQualifierProbability(team, side, simulatedResults) {
  if (!side?.group || !side?.position) return 0;
  return getPositionProbability(team, side.group, side.position, simulatedResults);
}

function getThirdPlaceSelectionProbability(team, slot, simulatedResults) {
  if (!slot?.sideB?.thirdPlace || !Array.isArray(slot.sideB.eligibleGroups)) return 0;
  if (!slot.sideB.eligibleGroups.includes(team.group)) return 0;
  if (slot.hostTeamSlot) return 0;

  const eligibleGroups = slot.sideB.eligibleGroups;
  const allComplete = simulatedResults && eligibleGroups.every((group) => isGroupComplete(group, simulatedResults));
  if (!allComplete) {
    return 1 / eligibleGroups.length;
  }

  const thirdPlaceTeams = eligibleGroups
    .map((group) => computeGroupStandings(group, simulatedResults)[2])
    .filter(Boolean)
    .sort((a, b) =>
      b.pts !== a.pts
        ? b.pts - a.pts
        : b.gd !== a.gd
          ? b.gd - a.gd
          : b.gf !== a.gf
            ? b.gf - a.gf
            : a.name.localeCompare(b.name)
    );

  return thirdPlaceTeams[0]?.code === team.code ? 1 : 0;
}

export function buildTeamPaths(team, bracket = MATCH_96_BRACKET, simulatedResults = null) {
  const { group } = team;
  const paths = [];

  for (const slot of Object.values(bracket ?? {})) {
    const sideA = slot?.sideA;
    const sideB = slot?.sideB;
    if (!sideA || !sideB) continue;

    if (group === sideA.group) {
      const position = sideA.position;
      const positionLabel = position === 1 ? "1st" : position === 2 ? "2nd" : `${position}th`;
      const sideAQualifyProbability = getPositionProbability(team, group, position, simulatedResults);
      const scenarioProbability = roundProbability(sideAQualifyProbability * KNOCKOUT_WIN_PROB * 100);

      if (sideB.thirdPlace) {
        paths.push({
          groupFinishLabel: `${positionLabel} in Group ${group}`,
          requiredPosition: position,
          r32Label: slot.r32Label,
          r32Opponent: {
            name: `Best 3rd-place team (${sideB.label})`,
            code: sideB.label,
            flag: "🏳️",
          },
          probability: scenarioProbability,
        });
      } else {
        TEAM_DATA.filter((candidate) => candidate.group === sideB.group).forEach((opponent) => {
          const opponentQualifierProbability = getSpecificQualifierProbability(opponent, sideB, simulatedResults);
          paths.push({
            groupFinishLabel: `${positionLabel} in Group ${group}`,
            requiredPosition: position,
            r32Label: slot.r32Label,
            r32Opponent: { name: opponent.name, code: opponent.code, flag: opponent.flag },
            probability: roundProbability(
              sideAQualifyProbability * opponentQualifierProbability * KNOCKOUT_WIN_PROB * 100
            ),
          });
        });
      }
    }

    if (!slot.hostTeamSlot && sideB.thirdPlace && sideB.eligibleGroups.includes(group)) {
      const thirdPlaceFinishProbability = getPositionProbability(team, group, 3, simulatedResults);
      const thirdPlaceSelectionProbability = getThirdPlaceSelectionProbability(team, slot, simulatedResults);
      paths.push({
        groupFinishLabel: `3rd in Group ${group}`,
        requiredPosition: 3,
        r32Label: slot.r32Label,
        r32Opponent: {
          name: `1st place Group ${sideA.group}`,
          code: `1${sideA.group}`,
          flag: "🏳️",
        },
        probability: roundProbability(
          thirdPlaceFinishProbability * thirdPlaceSelectionProbability * KNOCKOUT_WIN_PROB * 100
        ),
      });
    }

    if (sideB.group === group) {
      const position = sideB.position;
      const positionLabel = position === 1 ? "1st" : position === 2 ? "2nd" : `${position}th`;
      const sideBQualifyProbability = getPositionProbability(team, group, position, simulatedResults);
      TEAM_DATA.filter((candidate) => candidate.group === sideA.group).forEach((opponent) => {
        const opponentQualifierProbability = getSpecificQualifierProbability(opponent, sideA, simulatedResults);
        paths.push({
          groupFinishLabel: `${positionLabel} in Group ${group}`,
          requiredPosition: position,
          r32Label: slot.r32Label,
          r32Opponent: { name: opponent.name, code: opponent.code, flag: opponent.flag },
          probability: roundProbability(
            sideBQualifyProbability * opponentQualifierProbability * KNOCKOUT_WIN_PROB * 100
          ),
        });
      });
    }
  }

  return paths;
}

export function getTournamentPaths(teams, bracket = MATCH_96_BRACKET, simulatedResults = null) {
  return teams
    .map((team) => ({ team, paths: buildTeamPaths(team, bracket, simulatedResults) }))
    .filter(({ paths }) => paths.length > 0)
    .sort((a, b) => b.team.probability - a.team.probability);
}
