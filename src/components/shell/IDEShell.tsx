"use client";

import { ActivityBar } from "./ActivityBar";
import { StatusBar } from "./StatusBar";

interface IDEShellProps {
  children: React.ReactNode;
}

export function IDEShell({ children }: IDEShellProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-editor)",
        overflow: "hidden",
      }}
    >
      {/* Main row: ActivityBar + content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ActivityBar />
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </main>
      </div>

      {/* Status bar at the bottom */}
      <StatusBar />
    </div>
  );
}
