"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#0A0D1A",
        borderRadius: 8,
        border: "1px solid var(--border)",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "#0D1120",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
            letterSpacing: "0.02em",
          }}
        >
          {language ?? "code"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: copied ? "rgba(52,211,153,0.1)" : "transparent",
            border: copied ? "1px solid rgba(52,211,153,0.2)" : "1px solid transparent",
            borderRadius: 5,
            cursor: "pointer",
            color: copied ? "var(--color-success, #34D399)" : "var(--text-muted)",
            fontSize: 11,
            padding: "2px 7px",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={className}
        style={{
          margin: 0,
          padding: "14px 16px",
          overflowX: "auto",
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
          color: "var(--text-primary)",
          background: "transparent",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
