import React, { useState, useEffect, useCallback, useRef } from "react";
import { subscribeToUpdates, MATCH_CONFIGS, getTournamentPaths } from "./services/worldCupService.js";
import CanadaHighlight from "./components/CanadaHighlight.jsx";
import ProbabilityList from "./components/ProbabilityList.jsx";
import TournamentPathSection from "./components/TournamentPathSection.jsx";
import LastUpdated from "./components/LastUpdated.jsx";
import "./App.css";

// Poll for new results every 5 minutes
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function App() {
  const [teams, setTeams] = useState([]);
  const [canada, setCanada] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [matchesCompleted, setMatchesCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatchNumber, setSelectedMatchNumber] = useState(96);

  const matchConfig = MATCH_CONFIGS[selectedMatchNumber];
  // Track whether any data has been received yet so we only show the full
  // loading spinner on the very first load, not on subsequent match switches.
  const hasReceivedDataRef = useRef(false);

  const handleData = useCallback(({ teams: t, canada: c, matchesCompleted: mc, lastUpdated: lu }) => {
    hasReceivedDataRef.current = true;
    setTeams(t);
    setCanada(c);
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
            {/* ── Canada spotlight ── */}
            <section className="app__section" aria-labelledby="canada-heading">
              <h2 id="canada-heading" className="app__section-title">
                🇨🇦 Canada's Probability
              </h2>
              <CanadaHighlight canada={canada} matchInfo={matchConfig} />
            </section>

            {/* ── Tournament paths ── */}
            <section className="app__section" aria-labelledby="paths-heading">
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
                teamPaths={getTournamentPaths(teams, matchConfig.bracket)}
                matchInfo={matchConfig}
              />
            </section>

            {/* ── All countries > 1 % ── */}
            <section className="app__section" aria-labelledby="countries-heading">
              <h2 id="countries-heading" className="app__section-title">
                All Countries with Probability &gt; 1%
              </h2>
              <p className="app__section-desc">
                Showing {teams.length} countries whose estimated probability of
                playing in Match {matchConfig.matchNumber} exceeds 1%.
                Probabilities update automatically after each completed match.
              </p>
              <ProbabilityList teams={teams} />
            </section>

            {/* ── Status bar ── */}
            <LastUpdated
              lastUpdated={lastUpdated}
              matchesCompleted={matchesCompleted}
              refreshInterval={REFRESH_INTERVAL_MS}
            />
          </>
        )}
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
