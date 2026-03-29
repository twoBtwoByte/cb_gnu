import React, { useState, useEffect, useCallback } from "react";
import { subscribeToUpdates, MATCH_INFO, getTournamentPaths } from "./services/worldCupService.js";
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

  const handleData = useCallback(({ teams: t, canada: c, matchesCompleted: mc, lastUpdated: lu }) => {
    setTeams(t);
    setCanada(c);
    setMatchesCompleted(mc);
    setLastUpdated(lu);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeToUpdates(handleData, REFRESH_INTERVAL_MS);
    } catch (err) {
      setError("Failed to load probability data. Please refresh the page.");
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleData]);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app__header">
        <div className="app__header-content">
          <div className="app__trophy" aria-hidden="true">🏆</div>
          <div>
            <h1 className="app__title">FIFA World Cup 2026</h1>
            <p className="app__subtitle">
              Match {MATCH_INFO.matchNumber} Probability Tracker &mdash; {MATCH_INFO.stage}
            </p>
            <p className="app__venue">
              📍 {MATCH_INFO.venue}, {MATCH_INFO.city}, {MATCH_INFO.country}
              &nbsp;&middot;&nbsp;
              {MATCH_INFO.scheduledDate}
            </p>
          </div>
        </div>
      </header>

      <main className="app__main">
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
              <CanadaHighlight canada={canada} matchInfo={MATCH_INFO} />
            </section>

            {/* ── Tournament paths ── */}
            <section className="app__section" aria-labelledby="paths-heading">
              <h2 id="paths-heading" className="app__section-title">
                🗺️ Tournament Paths to Match {MATCH_INFO.matchNumber}
              </h2>
              <p className="app__section-desc">
                How each country can reach Match {MATCH_INFO.matchNumber} at{" "}
                {MATCH_INFO.venue}, {MATCH_INFO.city} on{" "}
                {MATCH_INFO.scheduledDate}. Each line shows a distinct
                scenario — a different group-stage finish position or a
                different Round of 32 opponent — together with its estimated
                probability.
              </p>
              <TournamentPathSection
                teamPaths={getTournamentPaths(teams)}
                matchInfo={MATCH_INFO}
              />
            </section>

            {/* ── All countries > 1 % ── */}
            <section className="app__section" aria-labelledby="countries-heading">
              <h2 id="countries-heading" className="app__section-title">
                All Countries with Probability &gt; 1%
              </h2>
              <p className="app__section-desc">
                Showing {teams.length} countries whose estimated probability of
                playing in Match {MATCH_INFO.matchNumber} exceeds 1%.
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
