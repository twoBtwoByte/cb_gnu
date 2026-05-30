import React, { useMemo, useState } from "react";
import { TEAM_DATA, MATCH_CONFIGS } from "../config/worldCupConfig.js";
import { useServices } from "../application/ServicesContext.jsx";
import { buildBracketSummary } from "../domain/tournament/bracketSummary.js";
import ProbabilityList from "../components/ProbabilityList.jsx";
import TournamentPathSection from "../components/TournamentPathSection.jsx";
import LastUpdated from "../components/LastUpdated.jsx";
import GroupSimulator from "../components/GroupSimulator.jsx";
import SpotlightCountryCard from "../components/SpotlightCountryCard.jsx";
import AppShell from "./AppShell.jsx";
import MatchSelector from "../features/match-probabilities/components/MatchSelector.jsx";
import SpotlightCountrySelector from "../features/match-probabilities/components/SpotlightCountrySelector.jsx";
import MatchTabs from "../features/match-probabilities/components/MatchTabs.jsx";
import { REFRESH_INTERVAL_MS, useMatchProbabilityData } from "../features/match-probabilities/hooks/useMatchProbabilityData.js";
import { useSpotlightCountry } from "../features/match-probabilities/hooks/useSpotlightCountry.js";
import { useSimulatorState } from "../features/match-probabilities/hooks/useSimulatorState.js";
import {
  buildDisplayAllTeams,
  buildLastUpdatedViewModel,
  buildProbabilityRows,
  buildSpotlightCardViewModel,
  buildSpotlightDisplayTeam,
  buildTournamentPathViewModel,
  filterDisplayTeams,
  getTeamBrackets,
  shouldShowSpotlightSection,
} from "../features/match-probabilities/selectors/probabilityViewModels.js";
import "../App.css";

function App() {
  const [selectedMatchNumber, setSelectedMatchNumber] = useState(96);
  const [activeTab, setActiveTab] = useState("countries");
  const { probabilityEngine, simulatorEngine, pathBuilder } = useServices();
  const { matchConfig, teams, allTeams, lastUpdated, matchesCompleted, loading, error, refresh } =
    useMatchProbabilityData(selectedMatchNumber);
  const simulator = useSimulatorState(matchConfig.bracket);

  const availableMatches = useMemo(() => Object.values(MATCH_CONFIGS), []);
  const spotlightCountryOptions = useMemo(
    () => [...TEAM_DATA].sort((left, right) => left.name.localeCompare(right.name)),
    []
  );
  const spotlight = useSpotlightCountry(spotlightCountryOptions);

  const { team1Bracket, team2Bracket } = useMemo(
    () => getTeamBrackets(matchConfig.bracket),
    [matchConfig.bracket]
  );

  const displayAllTeams = useMemo(
    () =>
      buildDisplayAllTeams({
        allTeams,
        bracket: matchConfig.bracket,
        team1Bracket,
        team2Bracket,
        simulatedResults: simulator.simulatedResults,
        isSimulating: simulator.isSimulating,
        probabilityEngine,
        simulatorEngine,
      }),
    [
      allTeams,
      matchConfig.bracket,
      probabilityEngine,
      simulator.isSimulating,
      simulator.simulatedResults,
      simulatorEngine,
      team1Bracket,
      team2Bracket,
    ]
  );

  const displayTeams = useMemo(() => filterDisplayTeams(displayAllTeams), [displayAllTeams]);
  const displaySpotlightTeam = useMemo(
    () => buildSpotlightDisplayTeam(displayAllTeams, spotlight.selectedSpotlightTeamMeta),
    [displayAllTeams, spotlight.selectedSpotlightTeamMeta]
  );
  const showSpotlightSection = useMemo(
    () => shouldShowSpotlightSection(spotlight.hasValidSpotlightSelection, displaySpotlightTeam),
    [displaySpotlightTeam, spotlight.hasValidSpotlightSelection]
  );
  const probabilityRows = useMemo(() => buildProbabilityRows(displayTeams), [displayTeams]);
  const spotlightCard = useMemo(
    () => buildSpotlightCardViewModel(displaySpotlightTeam, matchConfig),
    [displaySpotlightTeam, matchConfig]
  );
  const bracketNotes = useMemo(() => buildBracketSummary(matchConfig), [matchConfig]);
  const tournamentPathViewModel = useMemo(
    () =>
      buildTournamentPathViewModel({
        teamPaths: pathBuilder.getTournamentPaths(
          displayTeams,
          matchConfig.bracket,
          simulator.simulatedResults
        ),
        matchInfo: matchConfig,
        bracketNotes,
      }),
    [bracketNotes, displayTeams, matchConfig, pathBuilder, simulator.simulatedResults]
  );
  const lastUpdatedViewModel = useMemo(
    () =>
      buildLastUpdatedViewModel(
        lastUpdated,
        matchesCompleted + simulator.simulatorMatchCount,
        REFRESH_INTERVAL_MS
      ),
    [lastUpdated, matchesCompleted, simulator.simulatorMatchCount]
  );

  const tabs = useMemo(
    () => [
      {
        id: "countries",
        tabId: "tab-countries",
        panelId: "tab-panel-countries",
        label: "🌍 Countries",
        content: (
          <section className="app__section app__section--tab" aria-labelledby="countries-heading">
            <h2 id="countries-heading" className="app__section-title">
              All Countries with Probability &gt; 1%
            </h2>
            <p className="app__section-desc">
              Showing {displayTeams.length} countries whose estimated probability of playing in Match {matchConfig.matchNumber} exceeds 1%. Probabilities update automatically after each completed match.
            </p>
            <ProbabilityList rows={probabilityRows} />
          </section>
        ),
      },
      {
        id: "paths",
        tabId: "tab-paths",
        panelId: "tab-panel-paths",
        label: "🗺️ Paths",
        content: (
          <section className="app__section app__section--tab" aria-labelledby="paths-heading">
            <h2 id="paths-heading" className="app__section-title">
              🗺️ Tournament Paths to Match {matchConfig.matchNumber}
            </h2>
            <p className="app__section-desc">
              How each country can reach Match {matchConfig.matchNumber} at {matchConfig.venue}, {matchConfig.city} on {matchConfig.scheduledDate}. Each line shows a distinct scenario — a different group-stage finish position or a different Round of 32 opponent — together with its estimated probability.
            </p>
            <TournamentPathSection {...tournamentPathViewModel} />
          </section>
        ),
      },
      {
        id: "simulator",
        tabId: "tab-simulator",
        panelId: "tab-panel-simulator",
        label: "⚽ Simulator",
        content: (
          <section className="app__section app__section--tab" aria-labelledby="simulator-heading">
            <h2 id="simulator-heading" className="app__section-title">
              ⚽ Group Stage Simulator
            </h2>
            <GroupSimulator
              bracket={matchConfig.bracket}
              simulatedResults={simulator.simulatedResults}
              onResultChange={simulator.handleResultChange}
              onReset={simulator.handleReset}
              onAutoPopulate={simulator.handleAutoPopulate}
            />
          </section>
        ),
      },
    ],
    [
      displayTeams.length,
      matchConfig,
      probabilityRows,
      simulator.handleAutoPopulate,
      simulator.handleReset,
      simulator.handleResultChange,
      simulator.simulatedResults,
      tournamentPathViewModel,
    ]
  );

  const handleMatchSelection = (matchNumber) => {
    simulator.resetSimulator();
    setSelectedMatchNumber(matchNumber);
  };

  const header = (
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
  );

  const footer = (
    <footer className="app__footer">
      <p>
        Probabilities are estimated based on FIFA World Rankings and tournament path simulations. Data refreshes automatically every {REFRESH_INTERVAL_MS / 60000} minutes.
      </p>
      <div className="app__footer-actions">
        <a
          className="app__footer-btn"
          href="https://buymeacoffee.com/copiesarlo"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Buy Me a Coffee
        </a>
        <details className="app__feedback">
          <summary className="app__feedback-summary">💡 suggest improvements?</summary>
          <div className="app__feedback-content">
            <p className="app__feedback-copy">Help improve this website</p>
            <form
              className="app__feedback-form"
              action="https://github.com/twoBtwoByte/cb_gnu/issues/new"
              method="get"
              target="_blank"
            >
              <input type="hidden" name="title" value="Feedback: improvement suggestion" />
              <textarea
                className="app__feedback-input"
                name="body"
                rows="4"
                placeholder="What would you like to suggest?"
                required
              />
              <button type="submit" className="app__feedback-submit">
                Share
              </button>
            </form>
          </div>
        </details>
      </div>
    </footer>
  );

  return (
    <AppShell header={header} footer={footer}>
      {!spotlight.hasValidSpotlightSelection && (
        <SpotlightCountrySelector
          position="top"
          matchNumber={matchConfig.matchNumber}
          countryOptions={spotlightCountryOptions}
          value={spotlight.spotlightCode}
          onChange={spotlight.handleSpotlightCountryChange}
          onQuickSelect={spotlight.handleQuickSelectCanada}
        />
      )}

      <MatchSelector
        matches={availableMatches}
        selectedMatchNumber={selectedMatchNumber}
        onSelect={handleMatchSelection}
      />

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
          {showSpotlightSection && (
            <section className="app__section" aria-labelledby="spotlight-heading">
              <h2 id="spotlight-heading" className="app__section-title">
                {displaySpotlightTeam.flag} {displaySpotlightTeam.name}&apos;s Probability
              </h2>
              <SpotlightCountryCard {...spotlightCard} />
            </section>
          )}

          {simulator.isSimulating && (
            <div className="app__sim-banner" role="status" aria-live="polite">
              🎯 <strong>Simulation active</strong> — probabilities below reflect your entered scores. Reset scores to return to the base model.
            </div>
          )}

          <MatchTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

          <LastUpdated {...lastUpdatedViewModel} onRefresh={refresh} />
        </>
      )}

      {spotlight.hasValidSpotlightSelection && (
        <SpotlightCountrySelector
          position="bottom"
          matchNumber={matchConfig.matchNumber}
          countryOptions={spotlightCountryOptions}
          value={spotlight.spotlightCode}
          onChange={spotlight.handleSpotlightCountryChange}
          onQuickSelect={spotlight.handleQuickSelectCanada}
        />
      )}
    </AppShell>
  );
}

export default App;
