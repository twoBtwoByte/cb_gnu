import React from "react";

/**
 * LastUpdated
 *
 * Shows when the probability data was last refreshed and how many
 * World Cup matches have been completed so far.
 */
function LastUpdated({ lastUpdated, matchesCompleted, refreshInterval }) {
  if (!lastUpdated) return null;

  const timeStr = lastUpdated.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = lastUpdated.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const intervalMinutes = Math.round(refreshInterval / 60000);

  return (
    <div className="last-updated" aria-live="polite">
      <span className="last-updated__dot" aria-hidden="true" />
      <span>
        Updated&nbsp;<strong>{dateStr} at {timeStr}</strong>
        {" · "}
        <strong>{matchesCompleted}</strong> match{matchesCompleted !== 1 ? "es" : ""} completed
        {" · "}
        Refreshes every&nbsp;<strong>{intervalMinutes}&nbsp;min</strong>
      </span>
    </div>
  );
}

export default LastUpdated;
