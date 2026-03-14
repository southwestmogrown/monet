"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { Message } from "@/types/chat";

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "rgba(124,106,246,0.04)",
        border: "1px solid rgba(124,106,246,0.15)",
        borderRadius: 8,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: 11,
          fontFamily: "inherit",
        }}
      >
        <Sparkles size={12} color="var(--accent)" style={{ opacity: 0.7 }} />
        <span style={{ flex: 1, textAlign: "left", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}>
          Reasoning
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      <div
        style={{
          maxHeight: expanded ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 120ms ease-out",
        }}
      >
        <div
          style={{
            overflowY: "auto",
            maxHeight: 300,
            padding: "0 12px 12px",
          }}
        >
          <pre
            style={{
              fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
              fontSize: 12,
              color: "var(--text-muted)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {thinking}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
          paddingLeft: 64,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1C2852 0%, #1A2448 100%)",
            color: "var(--text-primary)",
            borderRadius: "14px 14px 3px 14px",
            padding: "10px 16px",
            maxWidth: "78%",
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            border: "1px solid rgba(124,106,246,0.2)",
            boxShadow: "0 1px 8px rgba(0,0,0,0.2)",
          }}
        >
          {message.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.imageUrl}
              alt="attached image"
              style={{
                maxWidth: 280,
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
                marginBottom: 8,
              }}
            />
          )}
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: 20,
        paddingRight: 64,
      }}
    >
      {/* Claude avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: "linear-gradient(135deg, #7C6AF6 0%, #A78BFA 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginRight: 12,
          marginTop: 1,
          boxShadow: "0 0 10px rgba(124,106,246,0.25)",
        }}
      >
        <Sparkles size={13} color="#fff" />
      </div>

      <div
        style={{
          flex: 1,
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--text-primary)",
        }}
        className="markdown-body"
      >
        {message.thinking ? (
          <ThinkingBlock thinking={message.thinking} />
        ) : null}
        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
                const match = /language-(\w+)/.exec(className || "");
                const codeStr = String(children).replace(/\n$/, "");
                const isBlock = codeStr.includes("\n") || match;

                if (isBlock) {
                  return (
                    <CodeBlock
                      code={codeStr}
                      language={match ? match[1] : undefined}
                      className={className}
                    />
                  );
                }
                return (
                  <code
                    {...props}
                    style={{
                      background: "rgba(124,106,246,0.1)",
                      border: "1px solid rgba(124,106,246,0.15)",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: "0.88em",
                      fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
                      color: "#A78BFA",
                    }}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return (
                  <p style={{ margin: "0 0 10px 0" }}>{children}</p>
                );
              },
              ul({ children }) {
                return (
                  <ul style={{ margin: "4px 0 10px 0", paddingLeft: 20 }}>
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol style={{ margin: "4px 0 10px 0", paddingLeft: 20 }}>
                    {children}
                  </ol>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote
                    style={{
                      borderLeft: "3px solid var(--accent)",
                      paddingLeft: 14,
                      margin: "10px 0",
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                    }}
                  >
                    {children}
                  </blockquote>
                );
              },
              h1({ children }) {
                return <h1 style={{ fontSize: "1.4em", fontWeight: 700, margin: "16px 0 8px", color: "var(--text-active)" }}>{children}</h1>;
              },
              h2({ children }) {
                return <h2 style={{ fontSize: "1.2em", fontWeight: 600, margin: "14px 0 6px", color: "var(--text-active)" }}>{children}</h2>;
              },
              h3({ children }) {
                return <h3 style={{ fontSize: "1.05em", fontWeight: 600, margin: "12px 0 4px", color: "var(--text-primary)" }}>{children}</h3>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : isStreaming ? (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 15,
              background: "var(--accent)",
              animation: "blink 1s step-end infinite",
              verticalAlign: "text-bottom",
              borderRadius: 2,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
