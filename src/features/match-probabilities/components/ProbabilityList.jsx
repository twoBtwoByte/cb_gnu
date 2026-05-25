import React from "react";

function ProbabilityList({ rows }) {
  if (!rows || rows.length === 0) {
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
            <th className="prob-list__role-header">Match Side</th>
            <th className="prob-list__bar-header" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`prob-list__row${row.isHighlighted ? " prob-list__row--canada" : ""}`}
            >
              <td className="prob-list__rank">{row.rank}</td>
              <td className="prob-list__flag" aria-hidden="true">{row.flag}</td>
              <td className="prob-list__name">
                {row.name}
                {row.isHost && (
                  <span className="prob-list__host-badge" title="Co-host nation">
                    &nbsp;🏠
                  </span>
                )}
              </td>
              <td className="prob-list__conf">{row.confederation}</td>
              <td className="prob-list__pct">
                <strong>{row.probabilityLabel}</strong>
              </td>
              <td className="prob-list__role-cell">
                {row.roleLines.length > 1 ? (
                  <span className="prob-list__role-multi">
                    {row.roleLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                ) : (
                  <span className="prob-list__role-single">{row.roleLines[0]}</span>
                )}
              </td>
              <td className="prob-list__bar-cell" aria-hidden="true">
                <div className="prob-list__bar-track">
                  <div
                    className={`prob-list__bar-fill${row.isHighlighted ? " prob-list__bar-fill--canada" : ""}`}
                    style={{ width: `${row.barWidth}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProbabilityList;
