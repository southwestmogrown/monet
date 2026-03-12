"use client";

import { useState, KeyboardEvent } from "react";
import { Play, Square, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface AgentTaskInputProps {
  onRun: (goal: string) => void;
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleRun = () => {
    if (!goal.trim() || isRunning) return;
    onRun(goal.trim());
    setGoal("");
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-sidebar)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
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
          borderRadius: 6,
          color: isRunning ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: 13,
          padding: "8px 12px",
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
          gap: 8,
          marginTop: 8,
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
              padding: "5px 12px",
              background: "#c0392b",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              color: "#fff",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            <Square size={12} fill="#fff" />
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
              padding: "5px 12px",
              background: goal.trim() ? "var(--accent)" : "var(--bg-active)",
              border: "none",
              borderRadius: 5,
              cursor: goal.trim() ? "pointer" : "not-allowed",
              color: goal.trim() ? "#fff" : "var(--text-muted)",
              fontSize: 12,
              fontFamily: "inherit",
              transition: "background 0.1s",
            }}
          >
            <Play size={12} />
            Run Agent
          </button>
        )}

        {isRunning && (
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
            Agent running…
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
            padding: "5px 8px",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 5,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "inherit",
          }}
        >
          <Trash2 size={11} />
          Clear
        </button>
      </div>
    </div>
  );
}
