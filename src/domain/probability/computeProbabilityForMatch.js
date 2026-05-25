import { TEAM_DATA } from "../../config/worldCupConfig.js";

/** Probability of either team winning a knockout match (no results yet). */
export const KNOCKOUT_WIN_PROB = 0.5;

export const GROUP_SIZES = TEAM_DATA.reduce((sizes, team) => {
  sizes[team.group] = (sizes[team.group] ?? 0) + 1;
  return sizes;
}, {});

export function roundProbability(value) {
  return Math.round(value * 1000) / 1000;
}

export function computeProbabilityForMatch(team, bracket) {
  if (!team || typeof team.group !== "string") return 0;
  if (!bracket || typeof bracket !== "object") return 0;

  const groupSize = GROUP_SIZES[team.group] ?? 4;
  let probability = 0;

  for (const slot of Object.values(bracket)) {
    if (!slot?.sideA || !slot?.sideB) continue;

    if (team.group === slot.sideA.group) {
      probability += (1 / groupSize) * KNOCKOUT_WIN_PROB * 100;
    }

    if (
      !slot.hostTeamSlot &&
      slot.sideB.thirdPlace &&
      Array.isArray(slot.sideB.eligibleGroups) &&
      slot.sideB.eligibleGroups.includes(team.group)
    ) {
      const poolSize = slot.sideB.eligibleGroups.length;
      probability += (1 / groupSize) * (1 / poolSize) * KNOCKOUT_WIN_PROB * 100;
    }

    if (slot.sideB.group && team.group === slot.sideB.group) {
      probability += (1 / groupSize) * KNOCKOUT_WIN_PROB * 100;
    }
  }

  return roundProbability(probability);
}
