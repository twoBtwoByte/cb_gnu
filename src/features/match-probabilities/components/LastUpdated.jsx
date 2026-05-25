import React from "react";

function LastUpdated({ updatedLabel, matchesCompletedLabel, refreshIntervalLabel, onRefresh }) {
  if (!updatedLabel) return null;

  return (
    <div className="last-updated" aria-live="polite">
      <span className="last-updated__dot" aria-hidden="true" />
      <span>
        Updated&nbsp;<strong>{updatedLabel}</strong>
        {" · "}
        <strong>{matchesCompletedLabel}</strong>
        {" · "}
        Refreshes every&nbsp;<strong>{refreshIntervalLabel}</strong>
      </span>
      {onRefresh && (
        <button
          className="last-updated__refresh-btn"
          onClick={onRefresh}
          aria-label="Refresh probability values"
        >
          ↻ Refresh
        </button>
      )}
    </div>
  );
}

export default LastUpdated;
