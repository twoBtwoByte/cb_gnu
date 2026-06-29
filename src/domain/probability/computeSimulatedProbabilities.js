import { isEliminatedAfterGroupStage, TEAM_DATA } from "../../config/worldCupConfig.js";
import { computeGroupStandings, isGroupComplete } from "../simulator/standings.js";
import { GROUP_SIZES, KNOCKOUT_WIN_PROB, roundProbability } from "./computeProbabilityForMatch.js";
import { MATCH_CONFIGS } from "../../config/worldCupConfig.js";

const MATCH_96_BRACKET = MATCH_CONFIGS[96].bracket;

export function computeSimulatedProbabilities(simulatedResults, bracket = MATCH_96_BRACKET) {
  const probabilities = {};
  TEAM_DATA.forEach((team) => {
    probabilities[team.code] = 0;
  });

  for (const slot of Object.values(bracket ?? {})) {
    if (!slot?.sideA || !slot?.sideB) continue;

    const { group: sideAGroup, position: sideAPosition } = slot.sideA;
    const sideAGroupSize = GROUP_SIZES[sideAGroup] ?? 4;

    if (isGroupComplete(sideAGroup, simulatedResults)) {
      const standings = computeGroupStandings(sideAGroup, simulatedResults);
      const qualifier = standings[sideAPosition - 1];
      if (qualifier) {
        probabilities[qualifier.code] += KNOCKOUT_WIN_PROB * 100;
      }
    } else {
      TEAM_DATA.filter((team) => team.group === sideAGroup).forEach((team) => {
        probabilities[team.code] += (1 / sideAGroupSize) * KNOCKOUT_WIN_PROB * 100;
      });
    }

    if (!slot.hostTeamSlot && slot.sideB.thirdPlace && Array.isArray(slot.sideB.eligibleGroups)) {
      const eligibleGroups = slot.sideB.eligibleGroups;
      const allComplete = eligibleGroups.every((group) => isGroupComplete(group, simulatedResults));

      if (allComplete) {
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

        if (thirdPlaceTeams[0]) {
          probabilities[thirdPlaceTeams[0].code] += KNOCKOUT_WIN_PROB * 100;
        }
      } else {
        eligibleGroups.forEach((group) => {
          const groupSize = GROUP_SIZES[group] ?? 4;
          TEAM_DATA.filter((team) => team.group === group).forEach((team) => {
            probabilities[team.code] +=
              (1 / groupSize) * (1 / eligibleGroups.length) * KNOCKOUT_WIN_PROB * 100;
          });
        });
      }
    }

    if (slot.sideB?.group) {
      const sideBGroup = slot.sideB.group;
      const sideBPosition = slot.sideB.position;
      const sideBGroupSize = GROUP_SIZES[sideBGroup] ?? 4;

      if (isGroupComplete(sideBGroup, simulatedResults)) {
        const standings = computeGroupStandings(sideBGroup, simulatedResults);
        const qualifier = standings[sideBPosition - 1];
        if (qualifier) {
          probabilities[qualifier.code] += KNOCKOUT_WIN_PROB * 100;
        }
      } else {
        TEAM_DATA.filter((team) => team.group === sideBGroup).forEach((team) => {
          probabilities[team.code] += (1 / sideBGroupSize) * KNOCKOUT_WIN_PROB * 100;
        });
      }
    }
  }

  Object.keys(probabilities).forEach((code) => {
    probabilities[code] = isEliminatedAfterGroupStage(code) ? 0 : roundProbability(probabilities[code]);
  });

  return probabilities;
}
