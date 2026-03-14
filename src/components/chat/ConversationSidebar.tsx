"use client";

import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <div
      style={{
        width: 228,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Conversations
        </span>
        <button
          onClick={onCreate}
          title="New conversation"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            padding: "3px 3px",
            borderRadius: 5,
            transition: "color 0.1s, background 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {conversations.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              color: "var(--text-muted)",
              fontSize: 12,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            No conversations yet.
            <br />
            <span
              style={{ color: "var(--accent)", cursor: "pointer", fontSize: 12 }}
              onClick={onCreate}
            >
              Start one →
            </span>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConvItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={() => onSelect(conv.id)}
              onDelete={() => onDelete(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConvItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        cursor: "pointer",
        background: isActive ? "var(--accent-glow)" : "transparent",
        borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
        color: isActive ? "var(--text-active)" : "var(--text-secondary)",
        position: "relative",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
        }
        const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
        if (btn) btn.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
        const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
        if (btn) btn.style.opacity = "0";
      }}
    >
      <MessageSquare size={12} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 12,
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {conversation.title}
      </span>
      <button
        className="del-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: "2px 2px",
          borderRadius: 4,
          opacity: 0,
          transition: "opacity 0.1s, color 0.1s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--color-error, #F87171)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
