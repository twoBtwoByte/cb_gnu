import React from "react";
import App from "./App.jsx";
import ScheduleExplorerApp from "../features/schedule-explorer/ScheduleExplorerApp.jsx";

export const isLegacyPath = (pathname) => /^\/v1(?:\/|$)/.test(pathname);

function RootApp() {
  if (isLegacyPath(window.location.pathname)) {
    return <App />;
  }

  return <ScheduleExplorerApp />;
}

export default RootApp;
