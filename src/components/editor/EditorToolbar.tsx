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
  const btnStyle = (color?: string) => ({
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    background: "none",
    border: `1px solid var(--border)`,
    borderRadius: 4,
    cursor: "pointer",
    color: color ?? "var(--text-secondary)",
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
        padding: "6px 12px",
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
          fontFamily: "monospace",
          marginRight: 4,
        }}
      >
        {fileName}
      </span>

      <div style={{ width: 1, height: 16, background: "var(--border)" }} />

      {/* Language selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 4,
          color: "var(--text-secondary)",
          fontSize: 11,
          padding: "2px 6px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id} style={{ background: "#333" }}>
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
            color: "var(--text-muted)",
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
          >
            <FileText size={12} />
            Explain
          </button>
          <button
            style={btnStyle()}
            onClick={() => onAIAction("refactor")}
            title="Refactor selected code"
          >
            <Wand2 size={12} />
            Refactor
          </button>
          <button
            style={btnStyle("var(--accent)")}
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
