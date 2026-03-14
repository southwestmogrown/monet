"use client";

import { usePathname } from "next/navigation";

interface StatusBarProps {
  model?: string;
  language?: string;
  tokenCount?: number;
}

const ROUTE_LABELS: Record<string, string> = {
  "/chat": "Chat",
  "/editor": "Editor",
  "/agent": "Agent",
  "/workbench": "Workbench",
  "/settings": "Settings",
};

export function StatusBar({ model, language, tokenCount }: StatusBarProps) {
  const pathname = usePathname();

  const routeLabel = Object.entries(ROUTE_LABELS).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] ?? "";

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, var(--accent) 0%, transparent 60%)",
          opacity: 0.6,
        }}
      />
      <div
        className="flex items-center px-4 gap-3 text-xs select-none"
        style={{
          height: 24,
          background: "var(--bg-status-bar)",
          color: "var(--text-muted)",
        }}
      >
        {/* Brand mark */}
        <span
          style={{
            fontWeight: 600,
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: "0.02em",
          }}
        >
          Monet
        </span>

        {routeLabel && (
          <>
            <span style={{ color: "var(--border)", fontSize: 10 }}>›</span>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{routeLabel}</span>
          </>
        )}

        <div className="flex-1" />

        {tokenCount !== undefined && tokenCount > 0 && (
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            {tokenCount.toLocaleString()} tokens
          </span>
        )}
        {language && (
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{language}</span>
        )}
        {model && (
          <span style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }}>
            {model}
          </span>
        )}
      </div>
    </div>
  );
}
