import React, { useCallback, useEffect, useMemo, useState } from "react";
import fallbackSchedule from "../../../public/data/worldCup2026Schedule.json";
import seedMatchResults from "../../../public/data/completedMatchResults.json";
import {
  getResultsUrl,
  getScheduleUrl,
  RESULTS_REFRESH_INTERVAL_MS,
} from "../../config/scheduleExplorerConfig.js";
import { buildScheduleExplorerModel } from "./scheduleExplorerUtils.js";
import "./ScheduleExplorerApp.css";

const isCertainProbability = (probability) => Math.abs(probability - 100) < 0.0005;

const formatSlotLabel = (slotNumbers = []) => {
  if (slotNumbers.length === 0) return "";
  if (slotNumbers.length === 1) return `Slot ${slotNumbers[0]}`;
  return `Slots ${slotNumbers.join(" & ")}`;
};

const withNoCacheParam = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ts=${Date.now()}`;
};

function useScheduleData() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");

  const refreshSchedule = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(withNoCacheParam(getScheduleUrl()), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load schedule (${response.status})`);
      }

      const latestSchedule = await response.json();
      if (!Array.isArray(latestSchedule)) {
        throw new Error("Schedule payload is invalid.");
      }

      setSchedule(latestSchedule);
      setLastLoadedAt(new Date().toISOString());
    } catch (loadError) {
      setSchedule(fallbackSchedule);
      setLastLoadedAt(new Date().toISOString());
      setError("Using fallback schedule data because the latest remote schedule could not be loaded.");
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(loadError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  return {
    schedule,
    loading,
    error,
    lastLoadedAt,
    refreshSchedule,
  };
}

function useMatchResults() {
  const [completedMatchResults, setCompletedMatchResults] = useState(
    seedMatchResults?.resultsByMatchNumber ?? {}
  );
  const [scoresLastUpdated, setScoresLastUpdated] = useState(seedMatchResults?.requestedAt ?? "");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");

  const refreshMatchResults = useCallback(async () => {
    setResultsLoading(true);
    setResultsError("");

    try {
      const response = await fetch(withNoCacheParam(getResultsUrl()), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load match results (${response.status})`);
      }

      const payload = await response.json();
      if (
        !payload ||
        typeof payload !== "object" ||
        !payload.resultsByMatchNumber ||
        typeof payload.resultsByMatchNumber !== "object"
      ) {
        throw new Error("Match results payload is invalid.");
      }

      setCompletedMatchResults(payload.resultsByMatchNumber);
      setScoresLastUpdated(typeof payload.requestedAt === "string" ? payload.requestedAt : "");
    } catch (loadError) {
      setResultsError(
        "Using cached match results because the latest remote results could not be loaded."
      );
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(loadError);
      }
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMatchResults();

    const intervalId = setInterval(refreshMatchResults, RESULTS_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshMatchResults]);

  return {
    completedMatchResults,
    scoresLastUpdated,
    resultsLoading,
    resultsError,
    refreshMatchResults,
  };
}

function ScheduleExplorerApp() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedHostCountry, setSelectedHostCountry] = useState("");
  const {
    schedule,
    loading,
    error,
    lastLoadedAt,
    refreshSchedule,
  } = useScheduleData();
  const {
    completedMatchResults,
    scoresLastUpdated,
    resultsLoading,
    resultsError,
    refreshMatchResults,
  } = useMatchResults();

  const model = useMemo(
    () => buildScheduleExplorerModel(schedule, completedMatchResults),
    [schedule, completedMatchResults]
  );

  useEffect(() => {
    if (selectedCountry && !model.countries.includes(selectedCountry)) {
      setSelectedCountry("");
    }
  }, [model.countries, selectedCountry]);

  useEffect(() => {
    if (selectedHostCountry && !model.hostCountries.includes(selectedHostCountry)) {
      setSelectedHostCountry("");
    }
  }, [model.hostCountries, selectedHostCountry]);

  const countryMatches = useMemo(() => {
    if (!selectedCountry) return [];
    return model.potentialMatchesByCountry[selectedCountry] ?? [];
  }, [model.potentialMatchesByCountry, selectedCountry]);

  const hostCountryMatches = useMemo(() => {
    if (!selectedHostCountry) return [];
    return model.matchesByHostCountry[selectedHostCountry] ?? [];
  }, [model.matchesByHostCountry, selectedHostCountry]);

  return (
    <div className="planner">
      <header className="planner__hero">
        <div className="planner__hero-content">
          <p className="planner__eyebrow">FIFA World Cup 2026</p>
          <h1>World Cup 2026 Match Planner</h1>
          <p>
            Select a country and venue to view every possible match path based on the official schedule mappings.
          </p>
        </div>
      </header>

      <main className="planner__main">
        <section className="planner__panel planner__panel--filters" aria-labelledby="planner-filters-heading">
          <h2 id="planner-filters-heading">Find potential matchups</h2>
          <p>
            Select either a team country or a host country to see all matches with probability greater than 0%.
          </p>

          <div className="planner__filters">
            <label className="planner__field" htmlFor="planner-country-select">
              <span>Team country</span>
              <select
                id="planner-country-select"
                value={selectedCountry}
                onChange={(event) => {
                  setSelectedCountry(event.target.value);
                  if (event.target.value) setSelectedHostCountry("");
                }}
              >
                <option value="">Select country</option>
                {model.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="planner__field" htmlFor="planner-host-country-select">
              <span>Host country</span>
              <select
                id="planner-host-country-select"
                value={selectedHostCountry}
                onChange={(event) => {
                  setSelectedHostCountry(event.target.value);
                  if (event.target.value) setSelectedCountry("");
                }}
              >
                <option value="">Select host country</option>
                {model.hostCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          </div>

        </section>

        <section className="planner__panel" aria-live="polite">
          {!selectedCountry && !selectedHostCountry && (
            <p className="planner__empty">Choose a team country or host country to see probability scenarios.</p>
          )}

          {selectedCountry && countryMatches.length === 0 && (
            <p className="planner__empty">No matches with non-zero probability for this team country.</p>
          )}

          {selectedCountry && countryMatches.length > 0 && (
            <>
              <h2>Matches {selectedCountry} may play in</h2>
              <ul className="planner__matches">
                {countryMatches.map((match) => {
                  const visibleScenarios = match.opponentScenarios.slice(0, 8);
                  const showScenarioSlot = visibleScenarios.length > 1;
                  const completedResult = completedMatchResults[match.matchNumber];

                  return (
                    <li key={match.matchNumber} className="planner__match-card">
                      <div>
                        <p className="planner__match-number">Match {match.matchNumber}</p>
                        {!isCertainProbability(match.probability) && (
                          <p className="planner__match-opponent">Play probability: {match.probability.toFixed(1)}%</p>
                        )}
                        <p className="planner__match-stage">{match.stage}</p>
                      </div>
                      {completedResult && (
                        <p className="planner__match-score">
                          Final score: {completedResult.homeTeam} {completedResult.homeScore} -{" "}
                          {completedResult.awayScore} {completedResult.awayTeam}
                        </p>
                      )}
                      <p>
                        {match.venue}, {match.country}
                      </p>
                      <p>{match.scheduledDate}</p>
                      {visibleScenarios.length > 0 && (
                        <ul className="planner__scenario-list">
                          {visibleScenarios.map((scenario) => (
                            <li key={`${match.matchNumber}-${scenario.slotNumber}-${scenario.opponentCountry}`}>
                              {showScenarioSlot && (
                                <span className="planner__scenario-slot">Slot {scenario.slotNumber}:</span>
                              )}
                              <span>
                                vs {scenario.opponentCountry}
                                {!isCertainProbability(scenario.probability) && ` (${scenario.probability.toFixed(1)}%)`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {selectedHostCountry && hostCountryMatches.length === 0 && (
            <p className="planner__empty">No matches found for this host country.</p>
          )}

          {selectedHostCountry && hostCountryMatches.length > 0 && (
            <>
              <h2>Matches in {selectedHostCountry}</h2>
              <ul className="planner__matches">
                {hostCountryMatches.map((match) => {
                  const completedResult = completedMatchResults[match.matchNumber];
                  return (
                    <li key={match.matchNumber} className="planner__match-card">
                      <div>
                        <p className="planner__match-number">Match {match.matchNumber}</p>
                        <p className="planner__match-stage">{match.stage}</p>
                      </div>
                      {completedResult && (
                        <p className="planner__match-score">
                          Final score: {completedResult.homeTeam} {completedResult.homeScore} -{" "}
                          {completedResult.awayScore} {completedResult.awayTeam}
                        </p>
                      )}
                      <p>
                        {match.venue}, {match.country}
                      </p>
                      <p>{match.scheduledDate}</p>
                      <ul className="planner__scenario-list">
                        {match.possibleTeams.map((team) => (
                          <li key={`${match.matchNumber}-${team.teamCountry}`}>
                            <span className="planner__scenario-slot">{formatSlotLabel(team.slotNumbers)}:</span>
                            <span>
                              <strong>{team.teamCountry}</strong>
                              {!isCertainProbability(team.probability) && `: ${team.probability.toFixed(1)}%`}
                            </span>
                            {!isCertainProbability(team.probability) && team.opponentScenarios.length > 0 && (
                              <> (vs {team.opponentScenarios[0].opponentCountry} most likely)</>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </main>

      <footer className="planner__footer">
        <div className="planner__footer-actions">
          <a
            className="planner__coffee"
            href="https://buymeacoffee.com/copiesarlo"
            target="_blank"
            rel="noopener noreferrer"
          >
            ☕ Buy Me a Coffee
          </a>
          <button
            className="planner__refresh-btn"
            type="button"
            onClick={refreshMatchResults}
            disabled={resultsLoading}
          >
            Refresh scores
          </button>
          <button className="planner__refresh-btn" type="button" onClick={refreshSchedule}>
            Refresh schedule
          </button>

          <details className="planner__feedback">
            <summary className="planner__feedback-summary">💡 Suggest Improvements</summary>
            <form
              className="planner__feedback-form"
              action="https://github.com/twoBtwoByte/cb_gnu/issues/new"
              method="get"
              target="_blank"
            >
              <input type="hidden" name="title" value="Feedback: improvement suggestion" />
              <textarea name="body" rows="4" placeholder="What would you like to suggest?" required />
              <button type="submit">Share</button>
            </form>
          </details>
        </div>
        {loading && <p className="planner__status">Loading latest schedule…</p>}
        {!loading && error && <p className="planner__status planner__status--warning">{error}</p>}
        {!loading && lastLoadedAt && (
          <p className="planner__status">Last refreshed: {new Date(lastLoadedAt).toLocaleString()}</p>
        )}
        {resultsLoading && <p className="planner__status">Loading latest match results…</p>}
        {!resultsLoading && resultsError && (
          <p className="planner__status planner__status--warning">{resultsError}</p>
        )}
        {scoresLastUpdated && (
          <p className="planner__status">
            Scores last updated: {scoresLastUpdated}
          </p>
        )}
      </footer>
    </div>
  );
}

export default ScheduleExplorerApp;
