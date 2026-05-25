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

  const formatTeamRole = (team) => {
    const team1Probability = team.team1Probability ?? 0;
    const team2Probability = team.team2Probability ?? 0;
    const showTeam1 = team1Probability >= 1;
    const showTeam2 = team2Probability >= 1;

    if (showTeam1 && showTeam2) {
      const roundedTeam1 = Number(team1Probability.toFixed(1));
      const roundedTeam2 = Number(team2Probability.toFixed(1));
      if (roundedTeam1 === roundedTeam2) {
        return (
          <span className="prob-list__role-single">
            both team 1 &amp; 2 ({roundedTeam1.toFixed(1)}%)
          </span>
        );
      }

      return (
        <span className="prob-list__role-multi">
          <span>team 1 ({team1Probability.toFixed(1)}%)</span>
          <span>team 2 ({team2Probability.toFixed(1)}%)</span>
        </span>
      );
    }

    if (showTeam1) {
      return <span className="prob-list__role-single">team 1 ({team1Probability.toFixed(1)}%)</span>;
    }

    if (showTeam2) {
      return <span className="prob-list__role-single">team 2 ({team2Probability.toFixed(1)}%)</span>;
    }

    return <span className="prob-list__role-single">—</span>;
  };

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
                <td className="prob-list__role-cell">{formatTeamRole(team)}</td>
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
