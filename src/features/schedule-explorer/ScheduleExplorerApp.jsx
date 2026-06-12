import React, { useCallback, useEffect, useMemo, useState } from "react";
import fallbackSchedule from "../../data/worldCup2026Schedule.json";
import { buildScheduleExplorerModel } from "./scheduleExplorerUtils.js";
import "./ScheduleExplorerApp.css";

const DEFAULT_SCHEDULE_URL =
  "https://raw.githubusercontent.com/twoBtwoByte/cb_gnu/main/src/data/worldCup2026Schedule.json";

const getScheduleUrl = () => import.meta.env.VITE_WORLD_CUP_SCHEDULE_URL ?? DEFAULT_SCHEDULE_URL;

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

  return { schedule, loading, error, lastLoadedAt, refreshSchedule };
}

function ScheduleExplorerApp() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const { schedule, loading, error, lastLoadedAt, refreshSchedule } = useScheduleData();

  const model = useMemo(() => buildScheduleExplorerModel(schedule), [schedule]);

  const countryOptions = useMemo(() => {
    if (!selectedVenue) return model.countries;

    return model.countries.filter((country) => model.countriesByVenue[selectedVenue]?.has(country));
  }, [model.countries, model.countriesByVenue, selectedVenue]);

  const venueOptions = useMemo(() => {
    if (!selectedCountry) return model.venues;

    return model.venues.filter((venue) => model.venuesByCountry[selectedCountry]?.has(venue));
  }, [model.venues, model.venuesByCountry, selectedCountry]);

  useEffect(() => {
    if (selectedCountry && !countryOptions.includes(selectedCountry)) {
      setSelectedCountry("");
    }
  }, [countryOptions, selectedCountry]);

  useEffect(() => {
    if (selectedVenue && !venueOptions.includes(selectedVenue)) {
      setSelectedVenue("");
    }
  }, [selectedVenue, venueOptions]);

  const selectedMatches = useMemo(() => {
    if (!selectedCountry) return [];
    const countryMatches = model.potentialMatchesByCountry[selectedCountry] ?? [];

    if (!selectedVenue) return countryMatches;

    return countryMatches.filter((match) => match.venue === selectedVenue);
  }, [model.potentialMatchesByCountry, selectedCountry, selectedVenue]);

  return (
    <div className="planner">
      <header className="planner__hero">
        <div className="planner__hero-content">
          <p className="planner__eyebrow">FIFA World Cup 2026</p>
          <h1>Potential Match Planner</h1>
          <p>
            Select a country and venue to view every possible match path based on the official schedule mappings.
          </p>
          <div className="planner__hero-actions">
            <a className="planner__link-btn" href="/v1">
              Open v1 tracker
            </a>
            <button className="planner__ghost-btn" type="button" onClick={refreshSchedule}>
              Refresh schedule
            </button>
          </div>
        </div>
      </header>

      <main className="planner__main">
        <section className="planner__panel planner__panel--filters" aria-labelledby="planner-filters-heading">
          <h2 id="planner-filters-heading">Find potential matchups</h2>
          <p>
            Countries are sourced from Group Stage bracket labels in the schedule JSON. Venues are sourced from all
            scheduled matches.
          </p>

          <div className="planner__filters">
            <label className="planner__field" htmlFor="planner-country-select">
              <span>Country</span>
              <select
                id="planner-country-select"
                value={selectedCountry}
                onChange={(event) => setSelectedCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="planner__field" htmlFor="planner-venue-select">
              <span>Venue</span>
              <select id="planner-venue-select" value={selectedVenue} onChange={(event) => setSelectedVenue(event.target.value)}>
                <option value="">Select venue</option>
                {venueOptions.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
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
        </section>

        <section className="planner__panel" aria-live="polite">
          {!selectedCountry && <p className="planner__empty">Choose a country to see possible matches.</p>}

          {selectedCountry && selectedMatches.length === 0 && (
            <p className="planner__empty">No potential matches found for this country at the selected venue.</p>
          )}

          {selectedCountry && selectedMatches.length > 0 && (
            <>
              <h2>
                {selectedCountry} can potentially play {selectedMatches.length} match
                {selectedMatches.length === 1 ? "" : "es"}
              </h2>
              <ul className="planner__matches">
                {selectedMatches.map((match) => (
                  <li key={match.matchNumber} className="planner__match-card">
                    <div>
                      <p className="planner__match-number">Match {match.matchNumber}</p>
                      <p className="planner__match-stage">{match.stage}</p>
                    </div>
                    <p>
                      {match.venue}, {match.city}, {match.country}
                    </p>
                    <p>{match.scheduledDate}</p>
                  </li>
                ))}
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

          <details className="planner__feedback">
            <summary>💡 Suggest Improvements</summary>
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
