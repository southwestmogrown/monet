"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "@/components/ui/Spinner";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { WorkbenchRun, CompareResult } from "@/types/workbench";

interface RunOutputPaneProps {
  run?: WorkbenchRun | null;
  compareResult?: CompareResult;
  label?: string;
  isLoading?: boolean;
}

export function RunOutputPane({
  run,
  compareResult,
  label,
  isLoading,
}: RunOutputPaneProps) {
  const output = run?.output ?? compareResult?.output ?? "";
  const usage = run?.usage ?? compareResult?.usage;
  const error = compareResult?.error;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
        background: "var(--bg-sidebar)",
        minWidth: 0,
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
          background: "var(--bg-active)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label ?? "Output"}
        </span>
        {usage && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {usage.inputTokens}↑ {usage.outputTokens}↓ tokens
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            <Spinner size={14} />
            Running…
          </div>
        ) : error ? (
          <div style={{ color: "#f44336", fontSize: 12 }}>{error}</div>
        ) : output ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children }: React.ComponentPropsWithoutRef<"code">) {
                const match = /language-(\w+)/.exec(className || "");
                return (
                  <CodeBlock
                    code={String(children).replace(/\n$/, "")}
                    language={match ? match[1] : undefined}
                  />
                );
              },
              p({ children }) {
                return (
                  <p style={{ margin: "0 0 8px 0", fontSize: 13, lineHeight: 1.6 }}>
                    {children}
                  </p>
                );
              },
            }}
          >
            {output}
          </ReactMarkdown>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Output will appear here after running.
          </div>
        )}
      </div>
    </div>
  );
}
