import React from "react";

function MatchTabs({ activeTab, onTabChange, tabs }) {
  return (
    <div className="app__tabs">
      <div className="app__tab-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={tab.panelId}
            id={tab.tabId}
            className={`app__tab-btn${activeTab === tab.id ? " app__tab-btn--active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={tab.panelId}
          role="tabpanel"
          aria-labelledby={tab.tabId}
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export default MatchTabs;
