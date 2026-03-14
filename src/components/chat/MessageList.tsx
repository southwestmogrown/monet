"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "0 24px",
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,106,246,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7C6AF6 0%, #A78BFA 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(124,106,246,0.3)",
            }}
          >
            <Sparkles size={22} color="#fff" />
          </div>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
          How can Claude help you today?
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Start a conversation below
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={isStreaming && i === messages.length - 1}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
