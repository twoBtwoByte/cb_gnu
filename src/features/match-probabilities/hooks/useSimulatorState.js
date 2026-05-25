import { useCallback, useMemo, useState } from "react";

function isFilledScore(result) {
  return (
    result.homeScore !== "" &&
    result.awayScore !== "" &&
    !Number.isNaN(parseInt(result.homeScore, 10)) &&
    !Number.isNaN(parseInt(result.awayScore, 10))
  );
}

export function useSimulatorState() {
  const [simulatedResults, setSimulatedResults] = useState({});

  const handleResultChange = useCallback((matchKey, field, value) => {
    setSimulatedResults((previous) => ({
      ...previous,
      [matchKey]: {
        ...(previous[matchKey] ?? { homeScore: "", awayScore: "" }),
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

  const isSimulating = useMemo(
    () => Object.values(simulatedResults).some((result) => result.homeScore !== "" || result.awayScore !== ""),
    [simulatedResults]
  );

  const simulatorMatchCount = useMemo(
    () => Object.values(simulatedResults).filter(isFilledScore).length,
    [simulatedResults]
  );

  return {
    simulatedResults,
    handleResultChange,
    handleReset,
    handleAutoPopulate,
    isSimulating,
    simulatorMatchCount,
    resetSimulator: handleReset,
  };
}
