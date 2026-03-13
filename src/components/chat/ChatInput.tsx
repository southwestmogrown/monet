"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Send, Square, Lightbulb, Paperclip, X } from "lucide-react";
import { MODELS, type ModelId } from "@/types/chat";
import { Spinner } from "@/components/ui/Spinner";
import { useChatStore } from "@/stores/chat-store";
import type { ImageAttachment } from "@/hooks/useChat";

interface ChatInputProps {
  onSend: (content: string, image?: ImageAttachment) => void;
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
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

  const readFileAsAttachment = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageAttachment({
        dataUrl: ev.target?.result as string,
        mediaType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFileAsAttachment(file);
    // Reset input so the same file can be re-selected if cleared
    e.target.value = "";
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          readFileAsAttachment(file);
          return;
        }
      }
    }
  };

  const handleSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim(), imageAttachment ?? undefined);
    setValue("");
    setImageAttachment(null);
    setSizeError(false);
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-sidebar)",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Thumbnail preview */}
      {imageAttachment && (
        <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageAttachment.dataUrl}
            alt="Attached image preview"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid var(--border)",
              display: "block",
            }}
          />
          <button
            onClick={() => setImageAttachment(null)}
            title="Remove attachment"
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={10} color="var(--text-primary)" />
          </button>
        </div>
      )}

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
        {/* Paperclip button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 5,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Paperclip size={15} color="var(--text-muted)" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
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

      {/* Size error */}
      {sizeError && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "#e74c3c",
          }}
        >
          Image too large (max 4 MB)
        </p>
      )}
    </div>
  );
}
