import React, { useMemo } from "react";
import { generateGroupMatches, computeGroupStandings, getSimulatorGroups } from "../services/worldCupService.js";

/**
 * GroupSimulator
 *
 * Renders score-entry inputs for every group-stage match in all groups that
 * are relevant to Match 96 (Groups B, K, D, E, I, J, L for the default
 * bracket).  As scores are entered the live group standings update in real
 * time.  A parent component reads simulatedResults to recompute probabilities.
 *
 * Props:
 *   bracket          – Bracket config from MATCH_CONFIGS[n].bracket.
 *   simulatedResults – Object mapping matchKey → { homeScore, awayScore }.
 *   onResultChange   – Callback (matchKey, field, value) called on score input.
 *   onReset          – Callback to clear all simulated scores.
 */
function GroupSimulator({ bracket, simulatedResults, onResultChange, onReset }) {
  const relevantGroups = useMemo(() => getSimulatorGroups(bracket), [bracket]);
  const allMatches     = useMemo(() => generateGroupMatches(relevantGroups), [relevantGroups]);

  const matchesByGroup = useMemo(() => {
    const map = {};
    relevantGroups.forEach((g) => { map[g] = []; });
    allMatches.forEach((m) => map[m.group].push(m));
    return map;
  }, [allMatches, relevantGroups]);

  const hasAnyResult = Object.values(simulatedResults).some(
    (r) => r.homeScore !== "" || r.awayScore !== ""
  );

  return (
    <div className="simulator">
      <div className="simulator__toolbar">
        <p className="simulator__desc">
          Enter scores for any group matches to see how the standings and
          Match 96 probabilities would change. Probabilities update
          automatically as you type. Leave a score blank to keep the uniform
          (equal-chance) model for that group.
        </p>
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

/* ── GroupSection ────────────────────────────────────────────────────────── */

function GroupSection({ group, matches, simulatedResults, onResultChange }) {
  const standings = useMemo(
    () => computeGroupStandings(group, simulatedResults),
    [group, simulatedResults]
  );

  return (
    <div className="sim-group">
      <h3 className="sim-group__title">Group {group}</h3>

      {/* Match score inputs */}
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
                  onChange={(e) => onResultChange(match.key, "homeScore", e.target.value)}
                  aria-label={`${match.homeTeam.name} score`}
                />
                <span className="sim-match__sep" aria-hidden="true">–</span>
                <input
                  className="sim-match__input"
                  type="number"
                  min="0"
                  max="99"
                  value={result.awayScore}
                  onChange={(e) => onResultChange(match.key, "awayScore", e.target.value)}
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

      {/* Standings table */}
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
          {standings.map((row, idx) => (
            <tr
              key={row.code}
              className={`sim-standings__row sim-standings__row--pos${idx + 1}`}
            >
              <td className="sim-standings__pos">{idx + 1}</td>
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
