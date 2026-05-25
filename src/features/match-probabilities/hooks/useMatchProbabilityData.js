import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MATCH_CONFIGS } from "../../../config/worldCupConfig.js";
import { useServices } from "../../../application/ServicesContext.jsx";

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useMatchProbabilityData(selectedMatchNumber) {
  const { probabilityRepository } = useServices();
  const matchConfig = useMemo(() => MATCH_CONFIGS[selectedMatchNumber], [selectedMatchNumber]);
  const hasReceivedDataRef = useRef(false);

  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [matchesCompleted, setMatchesCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleData = useCallback(({ teams: nextTeams, allTeams: nextAllTeams, matchesCompleted: nextMatchesCompleted, lastUpdated: nextLastUpdated }) => {
    hasReceivedDataRef.current = true;
    setTeams(nextTeams);
    setAllTeams(Array.isArray(nextAllTeams) && nextAllTeams.length > 0 ? nextAllTeams : nextTeams);
    setMatchesCompleted(nextMatchesCompleted);
    setLastUpdated(nextLastUpdated);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!hasReceivedDataRef.current) {
      setLoading(true);
    }

    let unsubscribe;
    try {
      unsubscribe = probabilityRepository.subscribeToUpdates(
        handleData,
        REFRESH_INTERVAL_MS,
        matchConfig.bracket
      );
    } catch (caughtError) {
      setError("Failed to load probability data. Please refresh the page.");
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleData, matchConfig.bracket, probabilityRepository]);

  const refresh = useCallback(() => {
    probabilityRepository
      .getNotableProbabilities(matchConfig.bracket)
      .then(handleData)
      .catch(() => setError("Failed to refresh probability data. Please try again."));
  }, [handleData, matchConfig.bracket, probabilityRepository]);

  return {
    matchConfig,
    teams,
    allTeams,
    lastUpdated,
    matchesCompleted,
    loading,
    error,
    refresh,
  };
}
