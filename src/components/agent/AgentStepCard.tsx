"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AgentToolBadge } from "./AgentToolBadge";
import type { AgentStep } from "@/types/agent";

interface AgentStepCardProps {
  step: AgentStep;
}

export function AgentStepCard({ step }: AgentStepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    step.status === "running" ? (
      <Loader2
        size={13}
        color="var(--accent)"
        style={{
          animation: "spin 1s linear infinite",
          flexShrink: 0,
        }}
      />
    ) : step.status === "done" ? (
      <CheckCircle2 size={13} color="var(--color-success, #34D399)" style={{ flexShrink: 0 }} />
    ) : step.status === "error" ? (
      <XCircle size={13} color="var(--color-error, #F87171)" style={{ flexShrink: 0 }} />
    ) : null;

  const inputStr = JSON.stringify(step.input, null, 2);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 6,
        background: "var(--bg-sidebar)",
        transition: "border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-dim, rgba(124,106,246,0.25))";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 12px",
          cursor: "pointer",
        }}
      >
        {statusIcon}
        <AgentToolBadge tool={step.tool} />
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
          }}
        >
          {Object.values(step.input)[0] as string}
        </span>
        {expanded ? (
          <ChevronDown size={11} color="var(--text-muted)" />
        ) : (
          <ChevronRight size={11} color="var(--text-muted)" />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 12px",
            fontSize: 12,
            fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
          }}
        >
          <div style={{ color: "var(--text-muted)", marginBottom: 6, fontFamily: "inherit", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Input
          </div>
          <pre
            style={{
              background: "#070A14",
              borderRadius: 6,
              border: "1px solid var(--border)",
              padding: "8px 12px",
              overflowX: "auto",
              color: "var(--text-secondary)",
              fontSize: 11,
              margin: "0 0 10px 0",
              lineHeight: 1.5,
            }}
          >
            {inputStr}
          </pre>

          {step.result && (
            <>
              <div
                style={{ color: "var(--text-muted)", marginBottom: 6, fontFamily: "inherit", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Result
              </div>
              <pre
                style={{
                  background: "#070A14",
                  borderRadius: 6,
                  border: "1px solid rgba(52,211,153,0.15)",
                  padding: "8px 12px",
                  overflowX: "auto",
                  color: "#6EE7B7",
                  fontSize: 11,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 200,
                  overflow: "auto",
                  lineHeight: 1.5,
                }}
              >
                {step.result}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
