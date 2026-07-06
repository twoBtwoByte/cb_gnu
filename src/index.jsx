import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ScheduleExplorerApp from "./components/ScheduleExplorerApp.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ScheduleExplorerApp />
  </React.StrictMode>
);
