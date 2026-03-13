"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { Message } from "@/types/chat";

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "6px 10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          fontFamily: "monospace",
          fontSize: 11,
        }}
      >
        <Brain size={13} />
        <span style={{ flex: 1, textAlign: "left" }}>Reasoning</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <div
        style={{
          maxHeight: expanded ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease",
        }}
      >
        <div
          style={{
            overflowY: "auto",
            maxHeight: 300,
            padding: "6px 10px 10px",
          }}
        >
          <pre
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
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
          marginBottom: 12,
          paddingLeft: 48,
        }}
      >
        <div
          style={{
            background: "var(--user-bubble)",
            color: "var(--text-primary)",
            borderRadius: "12px 12px 2px 12px",
            padding: "8px 14px",
            maxWidth: "80%",
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="attached image"
              style={{
                maxWidth: 280,
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 6,
                display: "block",
                marginBottom: 6,
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
        marginBottom: 16,
        paddingRight: 48,
      }}
    >
      {/* Claude avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginRight: 10,
          marginTop: 2,
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "monospace",
        }}
      >
        C
      </div>

      <div
        style={{
          flex: 1,
          fontSize: 13,
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
                      background: "#2d2d2d",
                      borderRadius: 3,
                      padding: "1px 5px",
                      fontSize: "0.9em",
                      fontFamily: "monospace",
                    }}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return (
                  <p style={{ margin: "0 0 8px 0" }}>{children}</p>
                );
              },
              ul({ children }) {
                return (
                  <ul style={{ margin: "4px 0 8px 0", paddingLeft: 20 }}>
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol style={{ margin: "4px 0 8px 0", paddingLeft: 20 }}>
                    {children}
                  </ol>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote
                    style={{
                      borderLeft: "3px solid var(--accent)",
                      paddingLeft: 12,
                      margin: "8px 0",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : isStreaming ? (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "var(--accent)",
              animation: "blink 1s step-end infinite",
              verticalAlign: "text-bottom",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
