import React from "react";

function SpotlightCountrySelector({ position, matchNumber, countryOptions, value, onChange, onQuickSelect }) {
  return (
    <section
      className={`app__section app__spotlight-selector app__spotlight-selector--${position}`}
      aria-labelledby="spotlight-country-selector-heading"
    >
      <h2 id="spotlight-country-selector-heading" className="app__section-title">
        🌟 Spotlight Country
      </h2>
      <p className="app__section-desc">
        Select a World Cup country to spotlight its probability for Match {matchNumber}.
      </p>
      <label htmlFor="spotlight-country-select" className="app__spotlight-label">
        Country
      </label>
      <div className="app__spotlight-controls">
        <select
          id="spotlight-country-select"
          className="app__spotlight-select"
          value={value ?? ""}
          onChange={onChange}
        >
          <option value="">Select a spotlight country</option>
          {countryOptions.map((team) => (
            <option key={team.code} value={team.code}>
              {team.flag} {team.name}
            </option>
          ))}
        </select>
        <button type="button" className="app__spotlight-quick-link" onClick={onQuickSelect}>
          Default: Canada
        </button>
      </div>
    </section>
  );
}

export default SpotlightCountrySelector;
