"use client";

import { usePathname } from "next/navigation";

interface StatusBarProps {
  model?: string;
  language?: string;
  tokenCount?: number;
}

export function StatusBar({ model, language, tokenCount }: StatusBarProps) {
  const pathname = usePathname();

  const routeLabel = pathname.startsWith("/chat")
    ? "Chat"
    : pathname.startsWith("/editor")
      ? "Editor"
      : pathname.startsWith("/agent")
        ? "Agent"
        : pathname.startsWith("/workbench")
          ? "Workbench"
          : "";

  return (
    <div
      className="flex items-center px-3 gap-4 text-xs select-none"
      style={{
        height: 22,
        background: "var(--bg-status-bar)",
        color: "#ffffff",
        flexShrink: 0,
        borderTop: "1px solid rgba(0,0,0,0.2)",
      }}
    >
      <span style={{ fontWeight: 600, opacity: 0.9 }}>Monet</span>
      {routeLabel && (
        <span style={{ opacity: 0.75 }}>— {routeLabel}</span>
      )}

      <div className="flex-1" />

      {tokenCount !== undefined && tokenCount > 0 && (
        <span style={{ opacity: 0.75 }}>{tokenCount.toLocaleString()} tokens</span>
      )}
      {language && (
        <span style={{ opacity: 0.75 }}>{language}</span>
      )}
      {model && (
        <span style={{ opacity: 0.9, fontWeight: 500 }}>{model}</span>
      )}
    </div>
  );
}
