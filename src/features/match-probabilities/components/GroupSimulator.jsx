import React, { useCallback, useMemo } from "react";
import { useServices } from "../../../application/ServicesContext.jsx";

function GroupSimulator({ bracket, simulatedResults, onResultChange, onReset, onAutoPopulate }) {
  const { simulatorEngine } = useServices();
  const relevantGroups = useMemo(() => simulatorEngine.getSimulatorGroups(bracket), [bracket, simulatorEngine]);
  const allMatches = useMemo(() => simulatorEngine.generateGroupMatches(relevantGroups), [relevantGroups, simulatorEngine]);

  const matchesByGroup = useMemo(() => {
    const groupedMatches = {};
    relevantGroups.forEach((group) => {
      groupedMatches[group] = [];
    });
    allMatches.forEach((match) => groupedMatches[match.group].push(match));
    return groupedMatches;
  }, [allMatches, relevantGroups]);

  const hasAnyResult = Object.values(simulatedResults).some(
    (result) => result.homeScore !== "" || result.awayScore !== ""
  );

  const handleAutoPopulate = useCallback(() => {
    const results = {};
    allMatches.forEach((match) => {
      results[match.key] = {
        homeScore: String(Math.floor(Math.random() * 8)),
        awayScore: String(Math.floor(Math.random() * 8)),
      };
    });
    onAutoPopulate(results);
  }, [allMatches, onAutoPopulate]);

  return (
    <div className="simulator">
      <div className="simulator__toolbar">
        <p className="simulator__desc">
          Enter scores for any group matches to see how the standings and Match 96 probabilities would change. Probabilities update automatically as you type. Leave a score blank to keep the uniform (equal-chance) model for that group.
        </p>
        <div className="simulator__btn-group">
          <button
            className="simulator__autopopulate-btn"
            onClick={handleAutoPopulate}
            aria-label="Auto-populate all match scores with random numbers"
          >
            🎲 Auto-populate scores
          </button>
          {hasAnyResult && (
            <button
              className="simulator__reset-btn"
              onClick={onReset}
              aria-label="Reset all simulated scores"
            >
              ↺ Reset all scores
            </button>
          )}
        </div>
      </div>

      <div className="simulator__groups">
        {relevantGroups.map((group) => (
          <GroupSection
            key={group}
            group={group}
            matches={matchesByGroup[group]}
            simulatedResults={simulatedResults}
            onResultChange={onResultChange}
          />
        ))}
      </div>
    </div>
  );
}

function GroupSection({ group, matches, simulatedResults, onResultChange }) {
  const { simulatorEngine } = useServices();
  const standings = useMemo(
    () => simulatorEngine.computeGroupStandings(group, simulatedResults),
    [group, simulatedResults, simulatorEngine]
  );

  return (
    <div className="sim-group">
      <h3 className="sim-group__title">Group {group}</h3>

      <div className="sim-group__matches">
        {matches.map((match) => {
          const result = simulatedResults[match.key] ?? { homeScore: "", awayScore: "" };
          return (
            <div key={match.key} className="sim-match">
              <span className="sim-match__team sim-match__team--home">
                <span className="sim-match__flag" aria-hidden="true">
                  {match.homeTeam.flag}
                </span>
                {match.homeTeam.name}
              </span>

              <div className="sim-match__scores">
                <input
                  className="sim-match__input"
                  type="number"
                  min="0"
                  max="99"
                  value={result.homeScore}
                  onChange={(event) => onResultChange(match.key, "homeScore", event.target.value)}
                  aria-label={`${match.homeTeam.name} score`}
                />
                <span className="sim-match__sep" aria-hidden="true">–</span>
                <input
                  className="sim-match__input"
                  type="number"
                  min="0"
                  max="99"
                  value={result.awayScore}
                  onChange={(event) => onResultChange(match.key, "awayScore", event.target.value)}
                  aria-label={`${match.awayTeam.name} score`}
                />
              </div>

              <span className="sim-match__team sim-match__team--away">
                <span className="sim-match__flag" aria-hidden="true">
                  {match.awayTeam.flag}
                </span>
                {match.awayTeam.name}
              </span>
            </div>
          );
        })}
      </div>

      <table className="sim-standings" aria-label={`Group ${group} standings`}>
        <thead>
          <tr>
            <th className="sim-standings__pos">#</th>
            <th className="sim-standings__flag" aria-hidden="true" />
            <th className="sim-standings__name">Team</th>
            <th className="sim-standings__num" title="Played">P</th>
            <th className="sim-standings__num" title="Wins">W</th>
            <th className="sim-standings__num" title="Draws">D</th>
            <th className="sim-standings__num" title="Losses">L</th>
            <th className="sim-standings__num" title="Goals For">GF</th>
            <th className="sim-standings__num" title="Goals Against">GA</th>
            <th className="sim-standings__num" title="Goal Difference">GD</th>
            <th className="sim-standings__pts" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr key={row.code} className={`sim-standings__row sim-standings__row--pos${index + 1}`}>
              <td className="sim-standings__pos">{index + 1}</td>
              <td className="sim-standings__flag" aria-hidden="true">{row.flag}</td>
              <td className="sim-standings__name">
                {row.name}
                {row.isHost && (
                  <span className="sim-standings__host" title="Co-host nation">
                    &nbsp;🏠
                  </span>
                )}
              </td>
              <td className="sim-standings__num">{row.played}</td>
              <td className="sim-standings__num">{row.w}</td>
              <td className="sim-standings__num">{row.d}</td>
              <td className="sim-standings__num">{row.l}</td>
              <td className="sim-standings__num">{row.gf}</td>
              <td className="sim-standings__num">{row.ga}</td>
              <td className="sim-standings__num">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
              <td className="sim-standings__pts">{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GroupSimulator;
