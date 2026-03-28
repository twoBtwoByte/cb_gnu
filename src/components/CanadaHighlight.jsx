import React from "react";

/**
 * CanadaHighlight
 *
 * Displays a prominent card showing Canada's probability of playing in Match 96
 * at BC Place, Vancouver.
 */
function CanadaHighlight({ canada, matchInfo }) {
  if (!canada) {
    return (
      <div className="canada-highlight canada-highlight--eliminated">
        <div className="canada-highlight__flag">🇨🇦</div>
        <h2 className="canada-highlight__team">Canada</h2>
        <p className="canada-highlight__probability">Eliminated</p>
        <p className="canada-highlight__note">Canada is no longer in contention for {matchInfo.description}.</p>
      </div>
    );
  }

  const pct = canada.probability.toFixed(1);

  return (
    <div className="canada-highlight">
      <div className="canada-highlight__badge">🍁 Host Nation</div>
      <div className="canada-highlight__flag">🇨🇦</div>
      <h2 className="canada-highlight__team">Canada</h2>
      <div className="canada-highlight__probability-container">
        <span className="canada-highlight__probability">{pct}%</span>
        <span className="canada-highlight__probability-label">probability</span>
      </div>
      <p className="canada-highlight__note">
        Estimated chance of Canada playing in{" "}
        <strong>Match {matchInfo.matchNumber}</strong> ({matchInfo.stage}) at{" "}
        <strong>{matchInfo.venue}, {matchInfo.city}</strong>
      </p>
      <div className="canada-highlight__bar">
        <div
          className="canada-highlight__bar-fill"
          style={{ width: `${Math.min(canada.probability * 5, 100)}%` }}
          role="progressbar"
          aria-valuenow={canada.probability}
          aria-valuemin={0}
          aria-valuemax={20}
          aria-label={`Canada probability: ${pct}%`}
        />
      </div>
    </div>
  );
}

export default CanadaHighlight;
