import React from "react";

function TournamentPathSection({ intro, bracketNotes, cards }) {
  if (!cards || cards.length === 0) {
    return <p className="path-section__empty">No tournament path data available.</p>;
  }

  return (
    <div className="path-section">
      <p className="path-section__intro">{intro}</p>

      <div className="path-section__bracket-note">
        <span className="path-section__bracket-tag">Bracket structure</span>
        {bracketNotes.map((note) => (
          <span key={note.label}>
            <strong>{note.label}:</strong> {note.description}
          </span>
        ))}
      </div>

      <div className="path-section__teams">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`path-card${card.isHighlighted ? " path-card--canada" : ""}`}
          >
            <div className="path-card__header">
              <span className="path-card__flag" aria-hidden="true">
                {card.flag}
              </span>
              <span className="path-card__name">
                {card.name}
                {card.isHost && (
                  <span className="path-card__host-badge" title="Co-host nation">
                    &nbsp;🏠
                  </span>
                )}
              </span>
              <span className="path-card__group">{card.groupLabel}</span>
              <span className="path-card__total-prob">
                Overall: <strong>{card.totalProbabilityLabel}</strong>
              </span>
            </div>

            <table className="path-card__table" aria-label={`Tournament paths for ${card.name}`}>
              <thead>
                <tr>
                  <th className="path-card__col-finish">Group finish</th>
                  <th className="path-card__col-r32">Round of 32 opponent</th>
                  <th className="path-card__col-r16">Round of 16</th>
                  <th className="path-card__col-prob">Probability</th>
                </tr>
              </thead>
              <tbody>
                {card.scenarios.map((scenario) => (
                  <tr key={scenario.id} className="path-card__row">
                    <td className="path-card__col-finish">
                      <span className="path-card__finish-badge">{scenario.groupFinishLabel}</span>
                    </td>
                    <td className="path-card__col-r32">
                      <span className="path-card__opp-flag" aria-hidden="true">
                        {scenario.opponentFlag}
                      </span>{" "}
                      {scenario.opponentName}
                      <span className="path-card__r32-label">&nbsp;({scenario.r32Label})</span>
                    </td>
                    <td className="path-card__col-r16">
                      <span className="path-card__bc-badge">{scenario.roundLabel}</span>
                    </td>
                    <td className="path-card__col-prob">
                      <strong className={card.isHighlighted ? "path-card__prob--canada" : ""}>
                        {scenario.probabilityLabel}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentPathSection;
