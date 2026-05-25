import React from "react";

/**
 * CanadaHighlight
 *
 * Displays a prominent card showing the spotlight country's probability of
 * playing in the selected match.
 */
function CanadaHighlight({ canada, matchInfo }) {
  if (!canada) {
    return null;
  }

  const isEliminated = canada.probability <= 0;
  const pct = canada.probability.toFixed(1);

  return (
    <div className={`canada-highlight${isEliminated ? " canada-highlight--eliminated" : ""}`}>
      <div className="canada-highlight__badge">🌟 Spotlight Country</div>
      <div className="canada-highlight__flag">{canada.flag}</div>
      <h2 className="canada-highlight__team">{canada.name}</h2>
      <div className="canada-highlight__probability-container">
        <span className="canada-highlight__probability">{isEliminated ? "Eliminated" : `${pct}%`}</span>
        <span className="canada-highlight__probability-label">probability</span>
      </div>
      <p className="canada-highlight__note">
        Estimated chance of {canada.name} playing in{" "}
        <strong>Match {matchInfo.matchNumber}</strong> ({matchInfo.stage}) at{" "}
        <strong>{matchInfo.venue}, {matchInfo.city}</strong>
      </p>
      <div className="canada-highlight__bar">
        <div
          className="canada-highlight__bar-fill"
          style={{ width: `${Math.min(canada.probability, 100)}%` }}
          role="progressbar"
          aria-valuenow={canada.probability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${canada.name} probability: ${pct}%`}
        />
      </div>
    </div>
  );
}

export default CanadaHighlight;
