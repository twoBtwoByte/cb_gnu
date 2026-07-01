export const DEFAULT_SCHEDULE_URL =
  "https://raw.githubusercontent.com/twoBtwoByte/cb_gnu/main/src/data/worldCup2026Schedule.json";

export const DEFAULT_RESULTS_URL =
  "https://raw.githubusercontent.com/twoBtwoByte/cb_gnu/main/src/data/completedMatchResults.json";

export const RESULTS_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export const getScheduleUrl = () =>
  import.meta.env.VITE_WORLD_CUP_SCHEDULE_URL ?? DEFAULT_SCHEDULE_URL;

export const getResultsUrl = () =>
  import.meta.env.VITE_COMPLETED_MATCH_RESULTS_URL ?? DEFAULT_RESULTS_URL;
