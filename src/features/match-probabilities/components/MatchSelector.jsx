import React from "react";

const formatGroupQualifier = (side) => {
  if (!side) return "";
  if (side.thirdPlace) {
    if (side.label) return side.label;
    return `3${(side.eligibleGroups ?? []).join("")}`;
  }
  if (typeof side.position === "number" && side.group) {
    return `${side.position}${side.group}`;
  }
  return "";
};

const formatWinnerFromR32Label = (r32Label = "") => {
  const numericParts = r32Label.match(/\d+/g) ?? [];
  const matchNumber = numericParts[numericParts.length - 1];
  return matchNumber ? `W${matchNumber}` : "";
};

const getMatchupLabel = (config) => {
  const slots = Object.entries(config.bracket ?? {})
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([, slot]) => slot);

  if (slots.length >= 2) {
    const winnerA = formatWinnerFromR32Label(slots[0].r32Label);
    const winnerB = formatWinnerFromR32Label(slots[1].r32Label);
    if (winnerA && winnerB) return `${winnerA} vs ${winnerB}`;
  }

  if (slots.length >= 1) {
    const sideA = formatGroupQualifier(slots[0].sideA);
    const sideB = formatGroupQualifier(slots[0].sideB);
    if (sideA && sideB) return `${sideA} vs ${sideB}`;
  }

  return "";
};

function MatchSelector({ matches, selectedMatchNumber, onSelect }) {
  return (
    <section className="app__section app__match-selector" aria-labelledby="match-selector-heading">
      <h2 id="match-selector-heading" className="app__section-title">
        🎯 Select a Match
      </h2>
      <p className="app__section-desc">
        Choose a match to see which countries have a path to that game and their estimated probability of playing in it.
      </p>
      <div className="match-selector__options">
        {matches.map((config) => (
          <button
            key={config.matchNumber}
            className={`match-selector__btn${selectedMatchNumber === config.matchNumber ? " match-selector__btn--active" : ""}`}
            onClick={() => onSelect(config.matchNumber)}
            aria-pressed={selectedMatchNumber === config.matchNumber}
          >
            <span className="match-selector__match-num">Match {config.matchNumber}</span>
            <span className="match-selector__match-detail">
              {config.stage} &middot; {config.venue}, {config.city}
            </span>
            <span className="match-selector__matchup">{getMatchupLabel(config)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default MatchSelector;
