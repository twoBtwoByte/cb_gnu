import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import RootApp from "./app/RootApp.jsx";
import { ServicesProvider } from "./application/ServicesContext.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ServicesProvider>
      <RootApp />
    </ServicesProvider>
  </React.StrictMode>
);
