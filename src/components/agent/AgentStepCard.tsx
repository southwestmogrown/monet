"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { AgentToolBadge } from "./AgentToolBadge";
import { Spinner } from "@/components/ui/Spinner";
import type { AgentStep } from "@/types/agent";

interface AgentStepCardProps {
  step: AgentStep;
}

export function AgentStepCard({ step }: AgentStepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    step.status === "running" ? (
      <Spinner size={14} />
    ) : step.status === "done" ? (
      <CheckCircle size={14} color="#4caf50" />
    ) : step.status === "error" ? (
      <XCircle size={14} color="#f44336" />
    ) : null;

  const inputStr = JSON.stringify(step.input, null, 2);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 8,
        background: "var(--bg-sidebar)",
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
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
            fontFamily: "monospace",
          }}
        >
          {Object.values(step.input)[0] as string}
        </span>
        {expanded ? (
          <ChevronDown size={12} color="var(--text-muted)" />
        ) : (
          <ChevronRight size={12} color="var(--text-muted)" />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 12px",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          <div style={{ color: "var(--text-muted)", marginBottom: 4, fontFamily: "inherit" }}>
            Input:
          </div>
          <pre
            style={{
              background: "#1a1a1a",
              borderRadius: 4,
              padding: "8px 10px",
              overflowX: "auto",
              color: "var(--text-secondary)",
              fontSize: 11,
              margin: "0 0 10px 0",
            }}
          >
            {inputStr}
          </pre>

          {step.result && (
            <>
              <div
                style={{ color: "var(--text-muted)", marginBottom: 4, fontFamily: "inherit" }}
              >
                Result:
              </div>
              <pre
                style={{
                  background: "#1a1a1a",
                  borderRadius: 4,
                  padding: "8px 10px",
                  overflowX: "auto",
                  color: "#aed581",
                  fontSize: 11,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 200,
                  overflow: "auto",
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
