"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={20} color="var(--text-muted)" />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
          Agent steps will appear here when a run starts.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
      {steps.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
            fontWeight: 600,
          }}
        >
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </div>
      )}

      {steps.map((step) => (
        <AgentStepCard key={step.id} step={step} />
      ))}

      {finalMessage && (
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            background:
              status === "error"
                ? "rgba(248,113,113,0.05)"
                : "rgba(52,211,153,0.05)",
            border: `1px solid ${status === "error" ? "rgba(248,113,113,0.25)" : "rgba(52,211,153,0.25)"}`,
            borderRadius: 8,
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: status === "error" ? "var(--color-error, #F87171)" : "var(--color-success, #34D399)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
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
