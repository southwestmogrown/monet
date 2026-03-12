"use client";

import { useEffect, useRef } from "react";
import { AgentStepCard } from "./AgentStepCard";
import type { AgentStep } from "@/types/agent";

interface AgentStepListProps {
  steps: AgentStep[];
  finalMessage?: string;
  status: string;
}

export function AgentStepList({ steps, finalMessage, status }: AgentStepListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps.length]);

  if (steps.length === 0 && !finalMessage) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 12,
        }}
      >
        Agent steps will appear here when a run starts.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {steps.length} step{steps.length !== 1 ? "s" : ""}
      </div>

      {steps.map((step) => (
        <AgentStepCard key={step.id} step={step} />
      ))}

      {finalMessage && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            background:
              status === "error"
                ? "#f443361a"
                : "#4caf501a",
            border: `1px solid ${status === "error" ? "#f44336" : "#4caf50"}44`,
            borderRadius: 6,
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: status === "error" ? "#f44336" : "#4caf50",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {status === "error" ? "Error" : "Final Answer"}
          </div>
          {finalMessage}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
