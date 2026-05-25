import React from "react";

function AppShell({ header, footer, children }) {
  return (
    <div className="app">
      {header}
      <main className="app__main">{children}</main>
      {footer}
    </div>
  );
}

export default AppShell;
