import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  subscribeToUpdates,
  getNotableProbabilities,
  MATCH_CONFIGS,
  TEAM_DATA,
  getTournamentPaths,
  computeSimulatedProbabilities,
  computeProbabilityForMatch,
} from "./services/worldCupService.js";
import CanadaHighlight from "./components/CanadaHighlight.jsx";
import ProbabilityList from "./components/ProbabilityList.jsx";
import TournamentPathSection from "./components/TournamentPathSection.jsx";
import LastUpdated from "./components/LastUpdated.jsx";
import GroupSimulator from "./components/GroupSimulator.jsx";
import "./App.css";

// Poll for new results every 5 minutes
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const SPOTLIGHT_COUNTRY_PARAM = "country";
const LEGACY_SPOTLIGHT_COUNTRY_PARAM = "spotlightCountry";

const normalizeCountryName = (value = "") => value.trim().toLowerCase();

const getSpotlightCodeFromSearchParams = (params) => {
  const rawCountry =
    params.get(SPOTLIGHT_COUNTRY_PARAM) ??
    params.get(LEGACY_SPOTLIGHT_COUNTRY_PARAM) ??
    "";
  const normalizedCountry = normalizeCountryName(rawCountry);
  if (!normalizedCountry) return null;

  const spotlightTeam = TEAM_DATA.find(
    (team) => normalizeCountryName(team.name) === normalizedCountry
  );
  return spotlightTeam?.code ?? null;
};

const getSpotlightCodeFromUrl = () => {
  if (typeof window === "undefined") return null;
  return getSpotlightCodeFromSearchParams(new URLSearchParams(window.location.search));
};

function App() {
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [matchesCompleted, setMatchesCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatchNumber, setSelectedMatchNumber] = useState(96);
  // simulatedResults: matchKey → { homeScore: string, awayScore: string }
  const [simulatedResults, setSimulatedResults] = useState({});
  const [activeTab, setActiveTab] = useState(1);
  const [spotlightCode, setSpotlightCode] = useState(() => getSpotlightCodeFromUrl());

  const matchConfig = MATCH_CONFIGS[selectedMatchNumber];
  // Track whether any data has been received yet so we only show the full
  // loading spinner on the very first load, not on subsequent match switches.
  const hasReceivedDataRef = useRef(false);

  const handleData = useCallback(({ teams: t, allTeams: at, matchesCompleted: mc, lastUpdated: lu }) => {
    hasReceivedDataRef.current = true;
    setTeams(t);
    setAllTeams(Array.isArray(at) && at.length > 0 ? at : t);
    setMatchesCompleted(mc);
    setLastUpdated(lu);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    // Only show the full-page loading spinner on the initial data fetch.
    // Subsequent match switches keep existing data visible while new data loads.
    if (!hasReceivedDataRef.current) {
      setLoading(true);
    }
    let unsubscribe;
    try {
      unsubscribe = subscribeToUpdates(handleData, REFRESH_INTERVAL_MS, MATCH_CONFIGS[selectedMatchNumber].bracket);
    } catch (err) {
      setError("Failed to load probability data. Please refresh the page.");
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleData, selectedMatchNumber]);

  const availableMatches = Object.values(MATCH_CONFIGS);
  const spotlightCountryOptions = useMemo(
    () => [...TEAM_DATA].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const selectedSpotlightTeamMeta = useMemo(
    () => spotlightCountryOptions.find((team) => team.code === spotlightCode) ?? null,
    [spotlightCountryOptions, spotlightCode]
  );

  const hasValidSpotlightSelection = Boolean(selectedSpotlightTeamMeta);

  const bracketSlots = useMemo(
    () =>
      Object.entries(matchConfig.bracket ?? {}).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [matchConfig.bracket]
  );

  const team1Bracket = useMemo(
    () =>
      bracketSlots[0] ? { [bracketSlots[0][0]]: bracketSlots[0][1] } : {},
    [bracketSlots]
  );

  const team2Bracket = useMemo(
    () =>
      bracketSlots[1] ? { [bracketSlots[1][0]]: bracketSlots[1][1] } : {},
    [bracketSlots]
  );

  // ── Simulator callbacks ──────────────────────────────────────────────────
  const handleResultChange = useCallback((matchKey, field, value) => {
    setSimulatedResults((prev) => ({
      ...prev,
      [matchKey]: {
        ...(prev[matchKey] ?? { homeScore: "", awayScore: "" }),
        [field]: value,
      },
    }));
  }, []);

  const handleReset = useCallback(() => {
    setSimulatedResults({});
  }, []);

  const handleAutoPopulate = useCallback((results) => {
    setSimulatedResults(results);
  }, []);

  // Reset simulated results when the selected match changes
  useEffect(() => {
    setSimulatedResults({});
  }, [selectedMatchNumber]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      setSpotlightCode(getSpotlightCodeFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSpotlightCountryChange = useCallback((event) => {
    const nextSpotlightCode = event.target.value || null;
    setSpotlightCode(nextSpotlightCode);

    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    if (!nextSpotlightCode) {
      searchParams.delete(SPOTLIGHT_COUNTRY_PARAM);
      searchParams.delete(LEGACY_SPOTLIGHT_COUNTRY_PARAM);
    } else {
      const selectedTeam = TEAM_DATA.find((team) => team.code === nextSpotlightCode);
      if (selectedTeam) {
        searchParams.set(SPOTLIGHT_COUNTRY_PARAM, selectedTeam.name);
      }
      searchParams.delete(LEGACY_SPOTLIGHT_COUNTRY_PARAM);
    }

    const search = searchParams.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  // ── Simulated probability display ────────────────────────────────────────
  const isSimulating = useMemo(
    () => Object.values(simulatedResults).some((r) => r.homeScore !== "" || r.awayScore !== ""),
    [simulatedResults]
  );

  // Count the number of matches populated in the simulator (both scores filled in).
  const simulatorMatchCount = useMemo(
    () =>
      Object.values(simulatedResults).filter(
        (r) =>
          r.homeScore !== "" &&
          r.awayScore !== "" &&
          !isNaN(parseInt(r.homeScore, 10)) &&
          !isNaN(parseInt(r.awayScore, 10))
      ).length,
    [simulatedResults]
  );

  // Manually refresh probability data from the live source.
  const handleRefresh = useCallback(() => {
    getNotableProbabilities(matchConfig.bracket)
      .then(handleData)
      .catch(() => setError("Failed to refresh probability data. Please try again."));
  }, [matchConfig.bracket, handleData]);

  // When the simulator is active, recalculate probabilities from entered scores.
  // Otherwise fall back to the live (polled) data.
  const displayAllTeams = useMemo(() => {
    if (!isSimulating) {
      return allTeams.map((t) => ({
        ...t,
        team1Probability: computeProbabilityForMatch(t, team1Bracket),
        team2Probability: computeProbabilityForMatch(t, team2Bracket),
      }));
    }

    const simProbs = computeSimulatedProbabilities(simulatedResults, matchConfig.bracket);
    const simTeam1Probs = computeSimulatedProbabilities(simulatedResults, team1Bracket);
    const simTeam2Probs = computeSimulatedProbabilities(simulatedResults, team2Bracket);
    const all = TEAM_DATA.map((t) => ({
      ...t,
      probability: simProbs[t.code] ?? 0,
      team1Probability: simTeam1Probs[t.code] ?? 0,
      team2Probability: simTeam2Probs[t.code] ?? 0,
    }));
    all.sort((a, b) => b.probability - a.probability);

    const notable = all.filter((t) => t.probability > 1);
    return notable;
  }, [isSimulating, simulatedResults, matchConfig, allTeams, team1Bracket, team2Bracket]);

  const displayTeams = useMemo(
    () => displayAllTeams.filter((team) => team.probability > 1),
    [displayAllTeams]
  );

  const displaySpotlightTeam = useMemo(() => {
    if (!selectedSpotlightTeamMeta) return null;

    const spotlightTeam = displayAllTeams.find((team) => team.code === selectedSpotlightTeamMeta.code);
    if (spotlightTeam) return spotlightTeam;

    return {
      ...selectedSpotlightTeamMeta,
      probability: 0,
      team1Probability: 0,
      team2Probability: 0,
    };
  }, [displayAllTeams, selectedSpotlightTeamMeta]);

  const renderSpotlightSelector = (position) => (
    <section
      className={`app__section app__spotlight-selector app__spotlight-selector--${position}`}
      aria-labelledby="spotlight-country-selector-heading"
    >
      <h2 id="spotlight-country-selector-heading" className="app__section-title">
        🌟 Spotlight Country
      </h2>
      <p className="app__section-desc">
        Select a World Cup country to spotlight its probability for Match {matchConfig.matchNumber}.
      </p>
      <label htmlFor="spotlight-country-select" className="app__spotlight-label">
        Country
      </label>
      <select
        id="spotlight-country-select"
        className="app__spotlight-select"
        value={spotlightCode ?? ""}
        onChange={handleSpotlightCountryChange}
      >
        <option value="">Select a spotlight country</option>
        {spotlightCountryOptions.map((team) => (
          <option key={team.code} value={team.code}>
            {team.flag} {team.name}
          </option>
        ))}
      </select>
    </section>
  );

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app__header">
        <div className="app__header-content">
          <div className="app__trophy" aria-hidden="true">🏆</div>
          <div>
            <h1 className="app__title">FIFA World Cup 2026</h1>
            <p className="app__subtitle">
              Match {matchConfig.matchNumber} Probability Tracker &mdash; {matchConfig.stage}
            </p>
            <p className="app__venue">
              📍 {matchConfig.venue}, {matchConfig.city}, {matchConfig.country}
              &nbsp;&middot;&nbsp;
              {matchConfig.scheduledDate}
            </p>
          </div>
        </div>
      </header>

      <main className="app__main">
        {!hasValidSpotlightSelection && renderSpotlightSelector("top")}

        {/* ── Match selector ── */}
        <section className="app__section app__match-selector" aria-labelledby="match-selector-heading">
          <h2 id="match-selector-heading" className="app__section-title">
            🎯 Select a Match
          </h2>
          <p className="app__section-desc">
            Choose a match to see which countries have a path to that game and
            their estimated probability of playing in it.
          </p>
          <div className="match-selector__options">
            {availableMatches.map((cfg) => (
              <button
                key={cfg.matchNumber}
                className={`match-selector__btn${selectedMatchNumber === cfg.matchNumber ? " match-selector__btn--active" : ""}`}
                onClick={() => setSelectedMatchNumber(cfg.matchNumber)}
                aria-pressed={selectedMatchNumber === cfg.matchNumber}
              >
                <span className="match-selector__match-num">Match {cfg.matchNumber}</span>
                <span className="match-selector__match-detail">
                  {cfg.stage} &middot; {cfg.venue}, {cfg.city}
                </span>
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="app__loading" role="status" aria-live="polite">
            <div className="app__spinner" aria-hidden="true" />
            <p>Loading probability data…</p>
          </div>
        )}

        {error && (
          <div className="app__error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Spotlight country ── */}
            {hasValidSpotlightSelection && displaySpotlightTeam && (
              <section className="app__section" aria-labelledby="spotlight-heading">
                <h2 id="spotlight-heading" className="app__section-title">
                  {displaySpotlightTeam.flag} {displaySpotlightTeam.name}&apos;s Probability
                </h2>
                <CanadaHighlight canada={displaySpotlightTeam} matchInfo={matchConfig} />
              </section>
            )}

            {isSimulating && (
              <div className="app__sim-banner" role="status" aria-live="polite">
                🎯 <strong>Simulation active</strong> — probabilities below reflect
                your entered scores. Reset scores to return to the base model.
              </div>
            )}

            {/* ── Tabbed sections ── */}
            <div className="app__tabs">
              <div className="app__tab-nav" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 1}
                  aria-controls="tab-panel-countries"
                  id="tab-countries"
                  className={`app__tab-btn${activeTab === 1 ? " app__tab-btn--active" : ""}`}
                  onClick={() => setActiveTab(1)}
                >
                  🌍 Countries
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 2}
                  aria-controls="tab-panel-paths"
                  id="tab-paths"
                  className={`app__tab-btn${activeTab === 2 ? " app__tab-btn--active" : ""}`}
                  onClick={() => setActiveTab(2)}
                >
                  🗺️ Paths
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 3}
                  aria-controls="tab-panel-simulator"
                  id="tab-simulator"
                  className={`app__tab-btn${activeTab === 3 ? " app__tab-btn--active" : ""}`}
                  onClick={() => setActiveTab(3)}
                >
                  ⚽ Simulator
                </button>
              </div>

              {/* Tab 1: All countries > 1% */}
              <div
                id="tab-panel-countries"
                role="tabpanel"
                aria-labelledby="tab-countries"
                hidden={activeTab !== 1}
              >
                <section className="app__section app__section--tab" aria-labelledby="countries-heading">
                  <h2 id="countries-heading" className="app__section-title">
                    All Countries with Probability &gt; 1%
                  </h2>
                  <p className="app__section-desc">
                    Showing {displayTeams.length} countries whose estimated probability of
                    playing in Match {matchConfig.matchNumber} exceeds 1%.
                    Probabilities update automatically after each completed match.
                  </p>
                  <ProbabilityList teams={displayTeams} />
                </section>
              </div>

              {/* Tab 2: Tournament paths */}
              <div
                id="tab-panel-paths"
                role="tabpanel"
                aria-labelledby="tab-paths"
                hidden={activeTab !== 2}
              >
                <section className="app__section app__section--tab" aria-labelledby="paths-heading">
                  <h2 id="paths-heading" className="app__section-title">
                    🗺️ Tournament Paths to Match {matchConfig.matchNumber}
                  </h2>
                  <p className="app__section-desc">
                    How each country can reach Match {matchConfig.matchNumber} at{" "}
                    {matchConfig.venue}, {matchConfig.city} on{" "}
                    {matchConfig.scheduledDate}. Each line shows a distinct
                    scenario — a different group-stage finish position or a
                    different Round of 32 opponent — together with its estimated
                    probability.
                  </p>
                  <TournamentPathSection
                    teamPaths={getTournamentPaths(displayTeams, matchConfig.bracket)}
                    matchInfo={matchConfig}
                  />
                </section>
              </div>

              {/* Tab 3: Group Stage Simulator */}
              <div
                id="tab-panel-simulator"
                role="tabpanel"
                aria-labelledby="tab-simulator"
                hidden={activeTab !== 3}
              >
                <section className="app__section app__section--tab" aria-labelledby="simulator-heading">
                  <h2 id="simulator-heading" className="app__section-title">
                    ⚽ Group Stage Simulator
                  </h2>
                  <GroupSimulator
                    bracket={matchConfig.bracket}
                    simulatedResults={simulatedResults}
                    onResultChange={handleResultChange}
                    onReset={handleReset}
                    onAutoPopulate={handleAutoPopulate}
                  />
                </section>
              </div>
            </div>

            {/* ── Status bar ── */}
            <LastUpdated
              lastUpdated={lastUpdated}
              matchesCompleted={matchesCompleted + simulatorMatchCount}
              refreshInterval={REFRESH_INTERVAL_MS}
              onRefresh={handleRefresh}
            />

          </>
        )}

        {hasValidSpotlightSelection && renderSpotlightSelector("bottom")}
      </main>

      <footer className="app__footer">
        <p>
          Probabilities are estimated based on FIFA World Rankings and tournament
          path simulations. Data refreshes automatically every{" "}
          {REFRESH_INTERVAL_MS / 60000} minutes.
        </p>
      </footer>
    </div>
  );
}

export default App;
