"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { Send, Square, Lightbulb } from "lucide-react";
import { MODELS, type ModelId } from "@/types/chat";
import { Spinner } from "@/components/ui/Spinner";
import { useChatStore } from "@/stores/chat-store";

interface ChatInputProps {
  onSend: (content: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
}

export function ChatInput({
  onSend,
  onCancel,
  isStreaming,
  model,
  onModelChange,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setThinkingEnabled = useChatStore((s) => s.setThinkingEnabled);
  const isHaiku = model === "claude-haiku-4-5-20251001";

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-sidebar)",
      }}
    >
      {/* Textarea row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "var(--bg-input)",
          borderRadius: 8,
          border: "1px solid var(--border)",
          padding: "8px 12px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude… (Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: "var(--text-primary)",
            fontSize: 13,
            lineHeight: 1.5,
            fontFamily: "inherit",
            maxHeight: 200,
            overflowY: "auto",
          }}
        />

        {isStreaming ? (
          <button
            onClick={onCancel}
            title="Stop generation"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "#c0392b",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Square size={14} color="#fff" fill="#fff" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim()}
            title="Send (Enter)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: value.trim() ? "var(--accent)" : "var(--bg-active)",
              border: "none",
              cursor: value.trim() ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background 0.1s",
            }}
          >
            <Send size={14} color={value.trim() ? "#fff" : "var(--text-muted)"} />
          </button>
        )}
      </div>

      {/* Bottom toolbar: thinking toggle + model selector + streaming indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Extended thinking toggle */}
          <button
            onClick={() => setThinkingEnabled(!thinkingEnabled)}
            title={
              thinkingEnabled
                ? "Thinking ON — Claude will show its reasoning"
                : "Enable extended thinking"
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 5,
              background: thinkingEnabled ? "var(--accent)" : "transparent",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.1s",
            }}
          >
            <Lightbulb
              size={13}
              color={thinkingEnabled ? "#fff" : "var(--text-muted)"}
            />
          </button>

          {/* Haiku → Sonnet upgrade warning */}
          {thinkingEnabled && isHaiku && (
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                background: "var(--bg-active)",
                borderRadius: 4,
                padding: "1px 5px",
                whiteSpace: "nowrap",
              }}
            >
              Haiku → Sonnet
            </span>
          )}

          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value as ModelId)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              color: "var(--text-secondary)",
              fontSize: 11,
              padding: "2px 6px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} style={{ background: "#333" }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {isStreaming && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
              fontSize: 11,
            }}
          >
            <Spinner size={12} />
            Generating…
          </div>
        )}
      </div>
    </div>
  );
}
