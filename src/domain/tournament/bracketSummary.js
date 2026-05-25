function describeBracketSide(side) {
  if (!side) return "Unknown qualifier";
  if (side.thirdPlace) {
    return `best 3rd-place team (${side.eligibleGroups?.join("/") ?? side.label ?? ""})`;
  }
  if (side.group && typeof side.position === "number") {
    const label = side.position === 1 ? "1st" : side.position === 2 ? "2nd" : `${side.position}th`;
    return `${label} place Group ${side.group}`;
  }
  return "Unknown qualifier";
}

export function buildBracketSummary(matchInfo) {
  return Object.values(matchInfo?.bracket ?? {}).map((slot) => ({
    label: slot.r32Label,
    description: `${describeBracketSide(slot.sideA)} vs ${describeBracketSide(slot.sideB)} → winner plays in Match ${matchInfo.matchNumber}`,
  }));
}
