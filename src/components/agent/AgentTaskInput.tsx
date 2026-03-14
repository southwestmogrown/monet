"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Play, Square, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useSettingsStore, ALL_AGENT_TOOLS } from "@/stores/settings-store";
import type { AgentToolName } from "@/types/agent";

interface AgentTaskInputProps {
  onRun: (goal: string, enabledTools: AgentToolName[]) => void;
  onCancel: () => void;
  onClear: () => void;
  isRunning: boolean;
}

export function AgentTaskInput({
  onRun,
  onCancel,
  onClear,
  isRunning,
}: AgentTaskInputProps) {
  const [goal, setGoal] = useState("");
  const [enabledTools, setEnabledTools] = useState<AgentToolName[]>(
    () => useSettingsStore.getState().agentToolDefaults
  );

  useEffect(() => {
    useSettingsStore.persist.rehydrate();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleRun = () => {
    if (!goal.trim() || isRunning) return;
    onRun(goal.trim(), enabledTools);
    setGoal("");
  };

  const toggleTool = (tool: AgentToolName) => {
    setEnabledTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-sidebar)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        Agent Goal
      </div>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isRunning}
        placeholder="Describe what you want the agent to accomplish… (Ctrl+Enter to run)"
        rows={3}
        style={{
          width: "100%",
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          color: isRunning ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: 14,
          padding: "10px 12px",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          lineHeight: 1.5,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 8,
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        {ALL_AGENT_TOOLS.map((tool) => (
          <label
            key={tool}
            style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", userSelect: "none" }}
          >
            <input
              type="checkbox"
              checked={enabledTools.includes(tool)}
              onChange={() => toggleTool(tool)}
              style={{ accentColor: "var(--accent)" }}
            />
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11 }}>{tool}</span>
          </label>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        {isRunning ? (
          <button
            onClick={onCancel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 7,
              cursor: "pointer",
              color: "var(--color-error, #F87171)",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            <Square size={11} fill="currentColor" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!goal.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: goal.trim()
                ? "linear-gradient(135deg, #7C6AF6 0%, #9580FF 100%)"
                : "var(--bg-active)",
              border: "none",
              borderRadius: 7,
              cursor: goal.trim() ? "pointer" : "not-allowed",
              color: goal.trim() ? "#fff" : "var(--text-muted)",
              fontSize: 12,
              fontFamily: "inherit",
              opacity: goal.trim() ? 1 : 0.6,
            }}
          >
            <Play size={11} />
            Run Agent
          </button>
        )}

        {isRunning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--accent)",
              fontSize: 11,
            }}
          >
            <Spinner size={11} />
            Running…
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={onClear}
          title="Clear run"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "inherit",
            transition: "color 0.1s, border-color 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--text-muted)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          <Trash2 size={11} />
          Clear
        </button>
      </div>
    </div>
  );
}
