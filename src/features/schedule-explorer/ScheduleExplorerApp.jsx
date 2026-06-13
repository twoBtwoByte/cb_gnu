import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import fallbackSchedule from "../../data/worldCup2026Schedule.json";
import { buildScheduleExplorerModel } from "./scheduleExplorerUtils.js";
import "./ScheduleExplorerApp.css";

const DEFAULT_SCHEDULE_URL =
  "https://raw.githubusercontent.com/twoBtwoByte/cb_gnu/main/src/data/worldCup2026Schedule.json";
const DEFAULT_FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_FOOTBALL_DATA_COMPETITION = "WC";
const SCORE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STORED_RESULTS_KEY = "scheduleExplorer.completedMatchResults.v1";

const getScheduleUrl = () => import.meta.env.VITE_WORLD_CUP_SCHEDULE_URL ?? DEFAULT_SCHEDULE_URL;
const getCompletedMatchesApiUrl = () => {
  const baseUrl = import.meta.env.VITE_FOOTBALL_DATA_API_BASE_URL ?? DEFAULT_FOOTBALL_DATA_BASE_URL;
  const competitionCode =
    import.meta.env.VITE_FOOTBALL_DATA_COMPETITION_CODE ?? DEFAULT_FOOTBALL_DATA_COMPETITION;
  return `${baseUrl}/competitions/${competitionCode}/matches?status=FINISHED`;
};

const isCertainProbability = (probability) => Math.abs(probability - 100) < 0.0005;
const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
]);

const formatSlotLabel = (slotNumbers = []) => {
  if (slotNumbers.length === 0) return "";
  if (slotNumbers.length === 1) return `Slot ${slotNumbers[0]}`;
  return `Slots ${slotNumbers.join(" & ")}`;
};

const toCanonicalCountrySlug = (value = "") => {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return COUNTRY_ALIASES.get(slug) ?? slug;
};

const withNoCacheParam = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ts=${Date.now()}`;
};

const getMatchLabels = (match) =>
  Object.values(match?.bracket ?? {})
    .map((slot) => (typeof slot?.label === "string" ? slot.label.trim() : ""))
    .filter(Boolean)
    .slice(0, 2);

const parseStoredResults = () => {
  try {
    const raw = window.localStorage.getItem(STORED_RESULTS_KEY);
    if (!raw) return { requestedAt: "", resultsByMatchNumber: {} };
    const parsed = JSON.parse(raw);
    return {
      requestedAt: typeof parsed?.requestedAt === "string" ? parsed.requestedAt : "",
      resultsByMatchNumber:
        parsed?.resultsByMatchNumber && typeof parsed.resultsByMatchNumber === "object"
          ? parsed.resultsByMatchNumber
          : {},
    };
  } catch {
    return { requestedAt: "", resultsByMatchNumber: {} };
  }
};

const persistResults = (payload) => {
  try {
    window.localStorage.setItem(STORED_RESULTS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures to keep the UI functional.
  }
};

const mapCompletedMatchesByNumber = (schedule, apiMatches) => {
  if (!Array.isArray(schedule) || schedule.length === 0 || !Array.isArray(apiMatches)) return {};

  const matchLookup = new Map(
    schedule.map((match) => {
      const [slot1 = "", slot2 = ""] = getMatchLabels(match);
      const key = [toCanonicalCountrySlug(slot1), toCanonicalCountrySlug(slot2)].sort().join("|");
      return [key, match.matchNumber];
    })
  );

  return apiMatches.reduce((accumulator, apiMatch) => {
    const homeTeam = apiMatch?.homeTeam?.name ?? "";
    const awayTeam = apiMatch?.awayTeam?.name ?? "";
    const homeScore = apiMatch?.score?.fullTime?.home;
    const awayScore = apiMatch?.score?.fullTime?.away;

    if (typeof homeScore !== "number" || typeof awayScore !== "number" || !homeTeam || !awayTeam) {
      return accumulator;
    }

    const key = [toCanonicalCountrySlug(homeTeam), toCanonicalCountrySlug(awayTeam)].sort().join("|");
    const matchNumber = matchLookup.get(key);
    if (!matchNumber) return accumulator;

    accumulator[matchNumber] = {
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
    };
    return accumulator;
  }, {});
};

function useScheduleData() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");
  const [completedMatchResults, setCompletedMatchResults] = useState({});
  const [scoreError, setScoreError] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [lastScoreRequestAt, setLastScoreRequestAt] = useState("");
  const completedMatchResultsRef = useRef({});
  const lastScoreRequestAtRef = useRef("");

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

  const refreshScores = useCallback(async () => {
    const requestedAt = new Date().toISOString();
    setScoreLoading(true);
    setScoreError("");

    try {
      const response = await fetch(withNoCacheParam(getCompletedMatchesApiUrl()), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...(import.meta.env.VITE_FOOTBALL_DATA_API_TOKEN
            ? {
                "X-Auth-Token": import.meta.env.VITE_FOOTBALL_DATA_API_TOKEN,
              }
            : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load completed matches (${response.status})`);
      }

      const payload = await response.json();
      const mappedResults = mapCompletedMatchesByNumber(schedule, payload?.matches);
      const nextValue = {
        requestedAt,
        resultsByMatchNumber: mappedResults,
      };
      setCompletedMatchResults(mappedResults);
      setLastScoreRequestAt(requestedAt);
      persistResults(nextValue);
    } catch (loadError) {
      setLastScoreRequestAt(requestedAt);
      setScoreError("Could not refresh completed match scores. Showing the last stored values.");
      persistResults({
        requestedAt,
        resultsByMatchNumber: completedMatchResultsRef.current,
      });
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(loadError);
      }
    } finally {
      setScoreLoading(false);
    }
  }, [schedule]);

  useEffect(() => {
    const stored = parseStoredResults();
    setCompletedMatchResults(stored.resultsByMatchNumber);
    setLastScoreRequestAt(stored.requestedAt);
  }, []);

  useEffect(() => {
    completedMatchResultsRef.current = completedMatchResults;
  }, [completedMatchResults]);

  useEffect(() => {
    lastScoreRequestAtRef.current = lastScoreRequestAt;
  }, [lastScoreRequestAt]);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  useEffect(() => {
    if (schedule.length === 0) return;

    const lastRequestTime = Date.parse(lastScoreRequestAtRef.current || "");
    const needsImmediateRefresh =
      Number.isNaN(lastRequestTime) || Date.now() - lastRequestTime >= SCORE_REFRESH_INTERVAL_MS;

    if (needsImmediateRefresh) {
      refreshScores();
    }

    const intervalId = setInterval(() => {
      const previousRequestTime = Date.parse(lastScoreRequestAtRef.current || "");
      if (Number.isNaN(previousRequestTime) || Date.now() - previousRequestTime >= SCORE_REFRESH_INTERVAL_MS) {
        refreshScores();
      }
    }, SCORE_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshScores, schedule.length]);

  return {
    schedule,
    loading,
    error,
    lastLoadedAt,
    refreshSchedule,
    completedMatchResults,
    scoreError,
    scoreLoading,
    lastScoreRequestAt,
    refreshScores,
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
    completedMatchResults,
    scoreError,
    scoreLoading,
    lastScoreRequestAt,
    refreshScores,
  } = useScheduleData();

  const model = useMemo(() => buildScheduleExplorerModel(schedule), [schedule]);

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
  const completedCountryMatchCount = useMemo(
    () =>
      countryMatches.reduce(
        (count, match) => (completedMatchResults[match.matchNumber] ? count + 1 : count),
        0
      ),
    [completedMatchResults, countryMatches]
  );

  return (
    <div className="planner">
      <header className="planner__hero">
        <div className="planner__hero-content">
          <p className="planner__eyebrow">FIFA World Cup 2026</p>
          <h1>Potential Match Planner</h1>
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

          {loading && <p className="planner__status">Loading latest schedule…</p>}
          {!loading && error && <p className="planner__status planner__status--warning">{error}</p>}
          {!loading && lastLoadedAt && (
            <p className="planner__status">Last refreshed: {new Date(lastLoadedAt).toLocaleString()}</p>
          )}
          {scoreLoading && <p className="planner__status">Refreshing completed match scores…</p>}
          {!scoreLoading && scoreError && (
            <p className="planner__status planner__status--warning">{scoreError}</p>
          )}
          {lastScoreRequestAt && (
            <p className="planner__status">
              Scores last requested: {new Date(lastScoreRequestAt).toLocaleString()}
            </p>
          )}
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
              <h2>
                {selectedCountry} can potentially play {countryMatches.length} match
                {countryMatches.length === 1 ? "" : "es"}
                {` (${completedCountryMatchCount} completed)`}
              </h2>
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
                        {match.venue}, {match.city}, {match.country}
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
                        {match.venue}, {match.city}, {match.country}
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
          <button className="planner__refresh-btn" type="button" onClick={refreshScores} disabled={scoreLoading}>
            {scoreLoading ? "Refreshing scores…" : "Refresh scores"}
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
      </footer>
    </div>
  );
}

export default ScheduleExplorerApp;
