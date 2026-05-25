import React from "react";

function SpotlightCountryCard({ flag, name, probability, probabilityLabel, matchLabel }) {
  if (!name) return null;

  const isEliminated = probability <= 0;

  return (
    <div className={`canada-highlight${isEliminated ? " canada-highlight--eliminated" : ""}`}>
      <div className="canada-highlight__badge">🌟 Spotlight Country</div>
      <div className="canada-highlight__flag">{flag}</div>
      <h2 className="canada-highlight__team">{name}</h2>
      <div className="canada-highlight__probability-container">
        <span className="canada-highlight__probability">{probabilityLabel}</span>
        <span className="canada-highlight__probability-label">probability</span>
      </div>
      <p className="canada-highlight__note">
        Estimated chance of {name} playing in <strong>{matchLabel}</strong>
      </p>
      <div className="canada-highlight__bar">
        <div
          className="canada-highlight__bar-fill"
          style={{ width: `${Math.min(probability, 100)}%` }}
          role="progressbar"
          aria-valuenow={probability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} probability: ${probabilityLabel}`}
        />
      </div>
    </div>
  );
}

export default SpotlightCountryCard;
