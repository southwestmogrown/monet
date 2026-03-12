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
        background: "#1a1a1a",
        borderRadius: 6,
        border: "1px solid var(--border)",
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {language && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 12px",
            background: "#2a2a2a",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {language}
          </span>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: copied ? "#4ec9b0" : "var(--text-secondary)",
              fontSize: 11,
              padding: "2px 4px",
              borderRadius: 3,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre
        className={className}
        style={{
          margin: 0,
          padding: "12px 16px",
          overflowX: "auto",
          fontSize: 13,
          lineHeight: 1.5,
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
