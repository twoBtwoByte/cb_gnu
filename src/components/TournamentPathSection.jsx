import React from "react";

/**
 * TournamentPathSection
 *
 * For every team that has a route to Match 96 at BC Place (July 7, 2026),
 * this section lists:
 *   – the group-stage finish position required
 *   – each possible Round-of-32 opponent (one scenario per line)
 *   – the estimated probability of that specific scenario occurring
 *
 * Teams whose bracket does not lead to BC Place are not shown here.
 */
function TournamentPathSection({ teamPaths, matchInfo }) {
  if (!teamPaths || teamPaths.length === 0) {
    return (
      <p className="path-section__empty">
        No tournament path data available.
      </p>
    );
  }

  return (
    <div className="path-section">
      <p className="path-section__intro">
        To appear in <strong>Match {matchInfo.matchNumber}</strong> at{" "}
        <strong>{matchInfo.venue}, {matchInfo.city}</strong> on{" "}
        <strong>{matchInfo.scheduledDate}</strong>, a team must finish in a
        specific position in their group and then win one Round of 32 game.
        Each row below is a distinct scenario. Probabilities reflect the
        estimated chance of that exact path occurring.
      </p>

      <div className="path-section__bracket-note">
        <span className="path-section__bracket-tag">Bracket structure</span>
        <span>
          <strong>R32 Match 87:</strong> 1st place Group C vs 2nd place Group B
          &nbsp;&rarr;&nbsp; winner plays in Match {matchInfo.matchNumber}
        </span>
        <span>
          <strong>R32 Match 88:</strong> 1st place Group D vs 2nd place Group E
          &nbsp;&rarr;&nbsp; winner plays in Match {matchInfo.matchNumber}
        </span>
      </div>

      <div className="path-section__teams">
        {teamPaths.map(({ team, paths }) => {
          const isCanada = team.code === "CAN";
          return (
            <div
              key={team.code}
              className={`path-card${isCanada ? " path-card--canada" : ""}`}
            >
              <div className="path-card__header">
                <span className="path-card__flag" aria-hidden="true">
                  {team.flag}
                </span>
                <span className="path-card__name">
                  {team.name}
                  {team.isHost && (
                    <span
                      className="path-card__host-badge"
                      title="Co-host nation"
                    >
                      &nbsp;🏠
                    </span>
                  )}
                </span>
                <span className="path-card__group">Group {team.group}</span>
                <span className="path-card__total-prob">
                  Overall:{" "}
                  <strong>{team.probability.toFixed(1)}%</strong>
                </span>
              </div>

              <table
                className="path-card__table"
                aria-label={`Tournament paths for ${team.name}`}
              >
                <thead>
                  <tr>
                    <th className="path-card__col-finish">Group finish</th>
                    <th className="path-card__col-r32">Round of 32 opponent</th>
                    <th className="path-card__col-r16">Round of 16</th>
                    <th className="path-card__col-prob">Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((scenario, idx) => (
                    <tr key={idx} className="path-card__row">
                      <td className="path-card__col-finish">
                        <span className="path-card__finish-badge">
                          {scenario.groupFinishLabel}
                        </span>
                      </td>
                      <td className="path-card__col-r32">
                        <span
                          className="path-card__opp-flag"
                          aria-hidden="true"
                        >
                          {scenario.r32Opponent.flag}
                        </span>{" "}
                        {scenario.r32Opponent.name}
                        <span className="path-card__r32-label">
                          &nbsp;({scenario.r32Label})
                        </span>
                      </td>
                      <td className="path-card__col-r16">
                        <span className="path-card__bc-badge">
                          📍 BC Place, Vancouver
                        </span>
                      </td>
                      <td className="path-card__col-prob">
                        <strong
                          className={
                            isCanada ? "path-card__prob--canada" : ""
                          }
                        >
                          {scenario.probability.toFixed(1)}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TournamentPathSection;
