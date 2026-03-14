"use client";

import { Wand2, FileText, Zap } from "lucide-react";
import { LANGUAGES, type EditorLanguage } from "@/types/editor";
import { Spinner } from "@/components/ui/Spinner";
import type { AIAction } from "@/types/editor";

interface EditorToolbarProps {
  language: EditorLanguage;
  fileName: string;
  isLoading: boolean;
  onLanguageChange: (lang: EditorLanguage) => void;
  onAIAction: (action: AIAction) => void;
}

export function EditorToolbar({
  language,
  fileName,
  isLoading,
  onLanguageChange,
  onAIAction,
}: EditorToolbarProps) {
  const btnStyle = (isAccent?: boolean) => ({
    display: "flex",
    alignItems: "center" as const,
    gap: 5,
    padding: "4px 10px",
    background: isAccent ? "var(--accent-dim)" : "transparent",
    border: `1px solid ${isAccent ? "rgba(124,106,246,0.3)" : "var(--border)"}`,
    borderRadius: 6,
    cursor: "pointer",
    color: isAccent ? "var(--accent)" : "var(--text-secondary)",
    fontSize: 11,
    fontFamily: "inherit",
    transition: "all 0.1s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* File name */}
      <span
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
          marginRight: 4,
        }}
      >
        {fileName}
      </span>

      <div style={{ width: 1, height: 14, background: "var(--border)", opacity: 0.7 }} />

      {/* Language selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: 5,
          color: "var(--text-secondary)",
          fontSize: 11,
          padding: "2px 8px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id} style={{ background: "#0E1422" }}>
            {l.label}
          </option>
        ))}
      </select>

      <div style={{ flex: 1 }} />

      {/* AI action buttons */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--accent)",
            fontSize: 11,
          }}
        >
          <Spinner size={12} />
          Asking Claude…
        </div>
      ) : (
        <>
          <button
            style={btnStyle()}
            onClick={() => onAIAction("explain")}
            title="Explain selected code"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            <FileText size={12} />
            Explain
          </button>
          <button
            style={btnStyle()}
            onClick={() => onAIAction("refactor")}
            title="Refactor selected code"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            <Wand2 size={12} />
            Refactor
          </button>
          <button
            style={btnStyle(true)}
            onClick={() => onAIAction("complete")}
            title="Complete code (Ctrl+Shift+L)"
          >
            <Zap size={12} />
            Complete
          </button>
        </>
      )}
    </div>
  );
}
