import React from "react";

/**
 * ProbabilityList
 *
 * Renders a ranked list of all countries whose probability of playing in
 * Match 96 at BC Place is greater than 1 %.
 */
function ProbabilityList({ teams }) {
  if (!teams || teams.length === 0) {
    return <p className="prob-list__empty">No probability data available.</p>;
  }

  return (
    <div className="prob-list">
      <table className="prob-list__table" aria-label="Country probabilities for Match 96">
        <thead>
          <tr>
            <th className="prob-list__rank">#</th>
            <th className="prob-list__flag" aria-hidden="true" />
            <th className="prob-list__name">Country</th>
            <th className="prob-list__conf">Confederation</th>
            <th className="prob-list__pct">Probability</th>
            <th className="prob-list__bar-header" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => {
            const isCanada = team.code === "CAN";
            const barWidth = team.probability;

            return (
              <tr
                key={team.code}
                className={`prob-list__row${isCanada ? " prob-list__row--canada" : ""}`}
              >
                <td className="prob-list__rank">{index + 1}</td>
                <td className="prob-list__flag" aria-hidden="true">{team.flag}</td>
                <td className="prob-list__name">
                  {team.name}
                  {team.isHost && (
                    <span className="prob-list__host-badge" title="Co-host nation">
                      &nbsp;🏠
                    </span>
                  )}
                </td>
                <td className="prob-list__conf">{team.confederation}</td>
                <td className="prob-list__pct">
                  <strong>{team.probability.toFixed(1)}%</strong>
                </td>
                <td className="prob-list__bar-cell" aria-hidden="true">
                  <div className="prob-list__bar-track">
                    <div
                      className={`prob-list__bar-fill${isCanada ? " prob-list__bar-fill--canada" : ""}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProbabilityList;
