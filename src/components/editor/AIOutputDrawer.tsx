"use client";

import { X, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { AIResult } from "@/types/editor";

interface AIOutputDrawerProps {
  result: AIResult;
  onApply: () => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  explain: "Explanation",
  refactor: "Refactored Code",
  complete: "Completion",
};

export function AIOutputDrawer({ result, onApply, onClose }: AIOutputDrawerProps) {
  const canApply = result.action === "refactor" || result.action === "complete";

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "45%",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Claude — {ACTION_LABELS[result.action] ?? result.action}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {canApply && (
            <button
              onClick={onApply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                background: "var(--accent)",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                color: "#fff",
                fontSize: 11,
                fontFamily: "inherit",
              }}
            >
              <Check size={11} />
              Apply to editor
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--text-primary)",
        }}
      >
        {result.action === "explain" ? (
          <ReactMarkdown
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code({ className, children }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return (
                  <CodeBlock
                    code={String(children).replace(/\n$/, "")}
                    language={match ? match[1] : undefined}
                  />
                );
              },
              p({ children }) {
                return <p style={{ margin: "0 0 8px 0" }}>{children}</p>;
              },
            }}
          >
            {result.output}
          </ReactMarkdown>
        ) : (
          <CodeBlock code={result.output} language="auto" />
        )}
      </div>
    </div>
  );
}
